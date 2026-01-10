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

    // Initialize GPT-4o-mini Vision model (cost-effective option)
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Get current date for context
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // Create the prompt for expense extraction - returns array of transactions
    const prompt = `You are an expert receipt and expense document analyzer. Carefully examine this image and extract transaction data.

STEP 1 - UNDERSTAND THE DOCUMENT:
- First, identify what type of document this is (receipt, bank statement, credit card statement, invoice, etc.)
- Identify the overall date of the document (usually at top or bottom)
- Identify if this contains a SINGLE transaction or MULTIPLE line items

STEP 2 - EXTRACT EACH TRANSACTION:
For EACH transaction/line item, you MUST correctly match:
- The DATE for that specific transaction
- The AMOUNT for that specific transaction  
- The DESCRIPTION for that specific transaction

CRITICAL: Do NOT mix up data between different line items. Each row's date, description, and amount must come from the SAME line.

STEP 3 - DATE PARSING RULES:
- Today's date is ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}
- Look for dates at the TOP, BOTTOM, or next to each line item
- Common formats: MM/DD/YY, MM/DD/YYYY, Jan 15 2025, 01-15-25, etc.
- If year is 2-digit (like "25"), convert to 4-digit (2025)
- If NO year visible, use ${currentYear} if date hasn't passed, else ${currentYear - 1}
- US format is typically MM/DD (month first)
- OUTPUT format MUST be: YYYY-MM-DD (e.g., 2025-01-09)

STEP 4 - AMOUNT PARSING RULES:
- Extract the numeric amount WITHOUT currency symbols ($, €, etc.)
- For negative amounts or credits, still use positive number and set type appropriately
- Be careful with decimal points and commas (1,234.56 = 1234.56)

STEP 5 - OUTPUT FORMAT:
Return ONLY a valid JSON array (no markdown, no explanation):

[
  {
    "trans_date": "YYYY-MM-DD",
    "amount": 123.45,
    "type": "Expense",
    "description": "exact item description from receipt",
    "source": null
  }
]

RULES:
- "type" is "Expense" for purchases/payments, "Income" for refunds/credits
- "source" is payment method if visible (Credit Card, Debit, Cash, Check), else null
- "description" should be the actual item name or merchant name, not generic text
- If document has multiple items, create one object per line item
- If single receipt with just a total, create one object with merchant name as description
- Return ONLY the JSON array, nothing else`;

    console.log("🤖 Sending to GPT-4o-mini for analysis...\n");

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
