import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";

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

    // Create the prompt for expense extraction - returns array of transactions
    const prompt = `Analyze this receipt/expense image and extract ALL transactions/line items.
Return ONLY a valid JSON ARRAY of transaction objects. Each transaction should have these fields (use null for missing values):

[
  {
    "trans_date": "YYYY-MM-DD format date of transaction",
    "amount": numeric amount (no currency symbols, just the number),
    "type": "Expense" or "Income",
    "description": "description of this specific item/transaction",
    "source": "payment method if visible (Credit Card, Cash, Debit, etc.)"
  }
]

Important:
- Extract EACH line item as a SEPARATE transaction in the array
- If the image shows multiple expenses/items, create one object per item
- If it's a single receipt with one total, return an array with one object
- Use ISO date format (YYYY-MM-DD)
- If you can't determine a field, use null
- Return ONLY the JSON array, no additional text`;

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
