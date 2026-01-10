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

    // Get current date in EST timezone
    const estFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const estParts = estFormatter.formatToParts(new Date());
    const currentYear = parseInt(estParts.find(p => p.type === 'year').value, 10);
    const currentMonth = parseInt(estParts.find(p => p.type === 'month').value, 10);
    const currentDay = parseInt(estParts.find(p => p.type === 'day').value, 10);

    // Create the prompt for expense extraction - returns array of transactions
    const prompt = `You are an OCR and data extraction expert. Extract transaction data from this image.

IMPORTANT: Today's date is ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')} (EST timezone).

STEP 1: CAREFULLY READ EACH DATE CHARACTER BY CHARACTER
Look at each date in the image very carefully. Read each digit one by one:
- Is the first digit a 0, 1, 2, etc.?
- Is the second digit a 0, 1, 2, etc.?
- Is there a slash or dash separator?
- Continue reading each character precisely.

STEP 2: TRANSCRIBE DATES EXACTLY AS WRITTEN
Copy the date EXACTLY as you see it - character by character. Examples:
- If you see "01/09" → raw_date: "01/09"
- If you see "1/9" → raw_date: "1/9"  
- If you see "01/09/25" → raw_date: "01/09/25"
- If you see "Jan 9" → raw_date: "Jan 9"

DO NOT GUESS. DO NOT ASSUME. COPY EXACTLY WHAT IS WRITTEN.

STEP 3: CONVERT raw_date TO trans_date
Convert the raw_date to YYYY-MM-DD format.

YEAR LOGIC (when year is not specified):
- If the date HAS ALREADY PASSED this year → use ${currentYear}
- If the date HAS NOT PASSED yet this year → use ${currentYear - 1}

Examples (today is ${currentMonth}/${currentDay}/${currentYear}):
- "01/05" → "${currentYear}-01-05" (Jan 5 has passed)
- "12/25" → "${currentYear - 1}-12-25" (Dec 25 has NOT passed yet)
- "01/09/25" → "2025-01-09" (year specified, use as-is)
- "01/09/2025" → "2025-01-09" (year specified, use as-is)

STEP 4: EXTRACT DESCRIPTION AND AMOUNT FOR SAME ROW
For each transaction row:
- The DATE, DESCRIPTION, and AMOUNT must all come from THE SAME ROW
- Do NOT mix data between different rows

OUTPUT FORMAT (JSON array ONLY - no other text):

[
  {
    "raw_date": "01/09",
    "trans_date": "${currentYear}-01-09",
    "description": "COFFEE SHOP",
    "amount": 5.75,
    "type": "Expense",
    "source": null
  }
]

FIELD RULES:
- raw_date: EXACT characters from document (verbatim copy)
- trans_date: Converted to YYYY-MM-DD
- description: Item/merchant name from that row
- amount: Number only (no $ symbol)
- type: "Expense" for purchases, "Income" for refunds/credits
- source: Payment method if visible, else null

BEFORE YOU RESPOND, VERIFY:
1. Did I copy each date's digits correctly? (Read them again!)
2. Did I convert the raw_date to trans_date correctly?
3. Is each row's data matched correctly (not mixed up)?

Return ONLY the JSON array.`;

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
      // Use EST timezone for all date calculations
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const estParts = estFormatter.formatToParts(new Date());
      const currentYear = parseInt(estParts.find(p => p.type === 'year').value, 10);
      const currentMonth = parseInt(estParts.find(p => p.type === 'month').value, 10);
      const currentDay = parseInt(estParts.find(p => p.type === 'day').value, 10);

      console.log("\n📊 RAW DATA FROM LLM:");
      transactionsArray.forEach((t, i) => {
        console.log(`  Row ${i + 1}: raw_date="${t.raw_date}" → trans_date="${t.trans_date}" | ${t.description} | $${t.amount}`);
      });

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
              // Determine year based on whether date has elapsed
              // If date has elapsed (is in the past this year) → use current year
              // If date has NOT elapsed (is in the future this year) → use previous year
              const hasElapsed = (parsedMonth < currentMonth) || 
                                 (parsedMonth === currentMonth && parsedDay <= currentDay);
              parsedYear = hasElapsed ? currentYear : (currentYear - 1);
              console.log(`  📅 Row ${idx + 1}: "${t.raw_date}" - month=${parsedMonth}, day=${parsedDay}, hasElapsed=${hasElapsed} → year=${parsedYear}`);
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
