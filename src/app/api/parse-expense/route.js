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
    "raw_date": "01/15",
    "trans_date": "2025-01-15",
    "description": "STARBUCKS COFFEE",
    "amount": 5.75,
    "type": "Expense",
    "source": null
  },
  {
    "raw_date": "01/14/25", 
    "trans_date": "2025-01-14", 
    "description": "AMAZON PURCHASE",
    "amount": 29.99,
    "type": "Expense",
    "source": null
  }
]

FIELD DEFINITIONS:
- "raw_date": EXACTLY what you see on the document (e.g., "01/15", "Jan 15", "1/15/25") - copy it verbatim
- "trans_date": The raw_date converted to YYYY-MM-DD format
- "description": Item name, merchant name, or transaction details from that row
- "amount": Dollar amount as a number (no $ symbol)
- "type": "Expense" for purchases, "Income" for refunds/credits/deposits  
- "source": Payment method if visible, otherwise null

FINAL RULES:
- One JSON object per transaction row
- RETURN ONLY THE JSON ARRAY - no explanations, no markdown
- If you cannot read a date clearly, put "UNCLEAR" in raw_date and null in trans_date

VERIFICATION CHECKLIST (complete before responding):
□ Each raw_date matches exactly what's written on that specific row
□ Each trans_date is correctly converted from its corresponding raw_date
□ No dates, descriptions, or amounts are swapped between rows
□ All amounts are positive numbers (use type "Income" for credits)`;

    console.log("🤖 Sending to GPT-4o for analysis...\n");

    // Send image to GPT-4 Vision with HIGH detail for better OCR
    const response = await model.invoke([
      new HumanMessage({
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "high", // Use high detail mode for better text recognition
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
      
      // Post-process: validate and fix dates using raw_date if available
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();

      const validatedTransactions = transactionsArray.map((t, idx) => {
        let finalDate = t.trans_date;
        
        // If we have raw_date, try to parse it ourselves as a backup
        if (t.raw_date && t.raw_date !== "UNCLEAR") {
          const rawDate = String(t.raw_date).trim();
          
          // Try to parse common formats
          let parsedMonth, parsedDay, parsedYear;
          
          // MM/DD/YY or MM/DD/YYYY or MM-DD-YY
          const slashMatch = rawDate.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
          if (slashMatch) {
            parsedMonth = parseInt(slashMatch[1], 10);
            parsedDay = parseInt(slashMatch[2], 10);
            if (slashMatch[3]) {
              parsedYear = parseInt(slashMatch[3], 10);
              if (parsedYear < 100) parsedYear += 2000;
            }
          }
          
          // Jan 15, January 15, etc.
          const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
          const textMatch = rawDate.toLowerCase().match(/^([a-z]+)\s*(\d{1,2})(?:,?\s*(\d{2,4}))?$/);
          if (textMatch) {
            const monthIdx = monthNames.findIndex(m => textMatch[1].startsWith(m));
            if (monthIdx !== -1) {
              parsedMonth = monthIdx + 1;
              parsedDay = parseInt(textMatch[2], 10);
              if (textMatch[3]) {
                parsedYear = parseInt(textMatch[3], 10);
                if (parsedYear < 100) parsedYear += 2000;
              }
            }
          }
          
          // If we parsed month and day, construct the date
          if (parsedMonth && parsedDay) {
            if (!parsedYear) {
              // Determine year based on whether date has passed
              if (parsedMonth < currentMonth || (parsedMonth === currentMonth && parsedDay <= currentDay)) {
                parsedYear = currentYear;
              } else {
                parsedYear = currentYear; // Future date this year
              }
            }
            
            // Validate month and day are in valid ranges
            if (parsedMonth >= 1 && parsedMonth <= 12 && parsedDay >= 1 && parsedDay <= 31) {
              // Construct date string directly (no Date object to avoid timezone issues)
              finalDate = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
            }
          }
        }
        
        // Log any date corrections
        if (finalDate !== t.trans_date) {
          console.log(`📅 Date corrected for row ${idx + 1}: "${t.raw_date}" → ${finalDate} (was: ${t.trans_date})`);
        }
        
        // Return cleaned transaction (remove raw_date from output)
        return {
          trans_date: finalDate,
          description: t.description,
          amount: t.amount,
          type: t.type,
          source: t.source,
        };
      });
      
      console.log(`\n✅ PARSED ${validatedTransactions.length} TRANSACTION(S):`);
      console.log("─".repeat(50));
      validatedTransactions.forEach((t, i) => {
        console.log(`Transaction ${i + 1}:`, JSON.stringify(t, null, 2));
      });
      console.log("─".repeat(50));
      console.log("========== RECEIPT SCAN END ==========\n");
      
      // Return the validated array
      return Response.json({
        success: true,
        data: validatedTransactions,
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
