import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

// Configure the route to allow larger body sizes (up to 10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// For App Router, also set the maximum duration and body size
export const maxDuration = 60; // seconds

export async function POST(request) {
  try {
    let base64Image;
    let mimeType = "image/jpeg";
    let imageName = "image";

    // Check content type to determine how to parse the request
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // Handle JSON request (base64 image from iOS/mobile)
      const jsonData = await request.json();
      
      if (!jsonData.image) {
        return Response.json({ error: "No image provided" }, { status: 400 });
      }

      // Extract base64 data from data URL (data:image/jpeg;base64,XXXX)
      const dataUrl = jsonData.image;
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      
      if (matches) {
        mimeType = matches[1];
        base64Image = matches[2];
      } else {
        // Assume it's already just base64
        base64Image = dataUrl;
      }
      
      imageName = jsonData.filename || "photo.jpg";
      
      console.log("\n========== RECEIPT SCAN START (JSON) ==========");
      console.log("📷 Image received:", imageName, `(${(base64Image.length / 1024).toFixed(2)} KB base64)`);

    } else {
      // Handle FormData request (traditional file upload)
      const formData = await request.formData();
      const imageFile = formData.get("image");

      if (!imageFile) {
        return Response.json({ error: "No image provided" }, { status: 400 });
      }

      // Convert image to base64
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64Image = buffer.toString("base64");
      mimeType = imageFile.type || "image/jpeg";
      imageName = imageFile.name || "image";

      console.log("\n========== RECEIPT SCAN START (FormData) ==========");
      console.log("📷 Image received:", imageName, `(${(bytes.byteLength / 1024).toFixed(2)} KB)`);
    }

    // Initialize GPT-4o Vision model (best accuracy for OCR)
    const model = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Get current date for context
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Create the prompt for expense extraction - returns array of transactions
    const prompt = `You are a precise data extraction expert. Your task is to extract transaction data from this document image.

═══════════════════════════════════════════════════════════════
CRITICAL: THE DOCUMENT HAS 3 MAIN COLUMNS PER ROW:
  1. DATE (MM/DD format) - when the transaction occurred
  2. DESCRIPTION - what was purchased or the merchant name  
  3. DOLLAR AMOUNT - how much was spent (e.g., $12.34)

YOU MUST NOT MIX UP ROWS. Each row's DATE, DESCRIPTION, and AMOUNT belong together.
═══════════════════════════════════════════════════════════════

EXTRACTION PROCESS:

STEP 1 - SCAN THE DOCUMENT:
- Read the document carefully from TOP to BOTTOM
- Identify each row/line item that contains transaction data
- Note: dates are often in MM/DD or MM/DD/YY format

STEP 2 - FOR EACH ROW, EXTRACT IN ORDER:
Read LEFT to RIGHT across the row and identify:
  a) The DATE on that row (look for MM/DD pattern)
  b) The DESCRIPTION on that row (item name, merchant, or transaction details)
  c) The DOLLAR AMOUNT on that row (look for $ symbol or decimal numbers)

STEP 3 - VERIFY YOUR EXTRACTION:
Before outputting, double-check each row:
  ✓ Is the date FROM THIS ROW (not copied from another row)?
  ✓ Is the description FROM THIS ROW?
  ✓ Is the amount FROM THIS ROW?
  ✓ Do these three pieces logically go together?

STEP 4 - DATE FORMATTING:
- Today is ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}
- Convert dates to YYYY-MM-DD format
- If year missing: use ${currentYear} if month/day hasn't passed, else ${currentYear - 1}
- MM/DD/YY → YYYY-MM-DD (e.g., 01/15/25 → 2025-01-15)
- Jan 15 → ${currentYear}-01-15

STEP 5 - AMOUNT FORMATTING:
- Remove $ symbol, keep only the number
- $1,234.56 → 1234.56
- Negative amounts (-$50.00) → use positive 50.00 with type "Income"

OUTPUT FORMAT (JSON array only, no other text):

[
  {
    "trans_date": "2025-01-15",
    "description": "STARBUCKS COFFEE",
    "amount": 5.75,
    "type": "Expense",
    "source": null
  },
  {
    "trans_date": "2025-01-14", 
    "description": "AMAZON PURCHASE",
    "amount": 29.99,
    "type": "Expense",
    "source": null
  }
]

FINAL RULES:
- "type": "Expense" for purchases, "Income" for refunds/credits/deposits
- "source": payment method if visible, otherwise null
- One JSON object per row in the document
- If only one transaction visible, return array with one object
- RETURN ONLY THE JSON ARRAY - no explanations, no markdown

DOUBLE-CHECK: Before responding, verify that you haven't accidentally swapped any dates, descriptions, or amounts between rows.`;

    console.log("🤖 Sending to GPT-4o for analysis...\n");

    // Send image to GPT-4 Vision
    const response = await model.invoke([
      new HumanMessage({
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      }),
    ]);

    // Parse the response
    const content = response.content;
    
    console.log("📄 RAW LLM RESPONSE:");
    console.log("─".repeat(50));
    console.log(content);
    console.log("─".repeat(50));
    
    // Try to extract JSON from the response
    let parsedData;
    try {
      // Handle case where response might have markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      parsedData = JSON.parse(jsonString.trim());
      
      // Ensure parsedData is always an array
      const transactionsArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      console.log(`\n✅ PARSED ${transactionsArray.length} TRANSACTION(S):`);
      console.log("─".repeat(50));
      transactionsArray.forEach((t, i) => {
        console.log(`Transaction ${i + 1}:`, JSON.stringify(t, null, 2));
      });
      console.log("─".repeat(50));
      console.log("========== RECEIPT SCAN END ==========\n");
      
      // Return the array
      return Response.json({
        success: true,
        data: transactionsArray,
      });
      
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError);
      console.log("========== RECEIPT SCAN FAILED ==========\n");
      return Response.json(
        { error: "Failed to parse expense data from image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error processing image:", error);
    return Response.json(
      { error: error.message || "Failed to process image" },
      { status: 500 }
    );
  }
}
