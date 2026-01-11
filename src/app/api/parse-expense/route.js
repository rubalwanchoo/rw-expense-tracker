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

// For App Router, set the maximum duration
export const maxDuration = 60; // seconds

export async function POST(request) {
  const startTime = Date.now();
  
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
      
      console.log("\n========== RECEIPT SCAN START ==========");
      console.log("📷 Image received:", imageName, `(${(base64Image.length / 1024).toFixed(1)} KB base64)`);

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

      console.log("\n========== RECEIPT SCAN START ==========");
      console.log("📷 Image received:", imageName, `(${(bytes.byteLength / 1024).toFixed(1)} KB)`);
    }

    // Initialize GPT-4o-mini for faster processing
    // Trade-off: Slightly less accurate but 2-3x faster and 15x cheaper
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxTokens: 2000, // Limit response size for faster completion
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

    // Streamlined prompt for faster processing
    const prompt = `Extract transactions from this receipt image. Today is ${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')} (EST).

For each transaction, return:
- raw_date: exact date text from image
- trans_date: date in YYYY-MM-DD format
- description: item/merchant name
- amount: number only
- type: "Expense" or "Income"
- source: null

YEAR RULES (when year not shown):
- Date already passed this year → use ${currentYear}
- Date not yet passed → use ${currentYear - 1}

Return ONLY a JSON array:
[{"raw_date":"01/09","trans_date":"${currentYear}-01-09","description":"STORE","amount":10.50,"type":"Expense","source":null}]`;

    console.log("🤖 Sending to GPT-4o-mini...");
    const apiStartTime = Date.now();

    // Send image with "auto" detail for optimal speed/quality balance
    const response = await model.invoke([
      new HumanMessage({
        content: [
          { type: "text", text: prompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: "auto", // Let OpenAI choose optimal detail level
            },
          },
        ],
      }),
    ]);

    const apiTime = ((Date.now() - apiStartTime) / 1000).toFixed(1);
    console.log(`⚡ API response received in ${apiTime}s`);

    // Parse the response
    const content = response.content;
    
    console.log("📄 LLM Response:", content.substring(0, 500) + (content.length > 500 ? "..." : ""));
    
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
              const hasElapsed = (parsedMonth < currentMonth) || 
                                 (parsedMonth === currentMonth && parsedDay <= currentDay);
              parsedYear = hasElapsed ? currentYear : (currentYear - 1);
            }
            
            // Validate month and day are in valid ranges
            if (parsedMonth >= 1 && parsedMonth <= 12 && parsedDay >= 1 && parsedDay <= 31) {
              finalDate = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-${String(parsedDay).padStart(2, '0')}`;
            }
          }
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
      
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Parsed ${validatedTransactions.length} transaction(s) in ${totalTime}s total`);
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
