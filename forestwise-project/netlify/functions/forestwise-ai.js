exports.handler = async function (event) {
  // 1. Handle CORS (Allows your frontend to talk to this function)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    // 2. Parse the incoming data
    const body = JSON.parse(event.body || "{}");
    const { message, conversationHistory = [], imageData, context, speciesData } = body;

   const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY || API_KEY.includes("PASTE_YOUR")) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Please paste your Gemini API Key in the forestwise-ai.js file." }),
      };
    }

    // 3. Configure Gemini API
    const MODEL_NAME = "gemini-2.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    // 4. Build the Brain (System Prompt)
    // This tells the AI how to behave and gives it your species database
    const speciesContext = speciesData 
      ? `REAL-TIME DATABASE ACCESS: You have access to the following trusted species database: ${JSON.stringify(speciesData)}.`
      : "DATABASE STATUS: Species database not provided for this request.";

    const systemInstruction = `
      You are ForestWise AI, a warm, knowledgeable, and passionate forestry expert dedicated to restoring Nigeria's ecosystems.
      
      YOUR PERSONALITY:
      - Tone: Friendly, encouraging, and deeply educational (like a wise mentor).
      - Style: Conversational and engaging. Don't just list facts; explain *why* they matter.
      - Perspective: You care about biodiversity, soil health, and sustainable living.
      
      YOUR DATA USAGE:
      1. You have access to a species database: ${speciesContext}
      2. INTELLIGENT SYNTHESIS: Do not just dump JSON data. If a user asks about a tree, weave the data into sentences. 
         - Bad: "Height: 15m. Soil: Loam."
         - Good: "This tree is a fantastic choice for your area! It grows to a majestic 15 meters and thrives in loamy soil, making it perfect for shade."
      3. MISSING DATA: If the database lacks info, use your general forestry knowledge to fill in the gaps, but mention that it's general advice.
      
      CONTEXT FROM USER SESSION:
      ${context || "The user is exploring tree options."}
      
      Goal: Help the user feel confident about planting trees.
    `.trim();

    // 5. Format History for Gemini
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // 6. Add the New Message (Text + Image support)
    const currentParts = [];
    if (message) currentParts.push({ text: message });
    
    if (imageData) {
      // Clean base64 string
      const base64Data = imageData.split(',')[1];
      const mimeType = imageData.substring(imageData.indexOf(':') + 1, imageData.indexOf(';'));
      
      currentParts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    // 7. Call Google (No extra libraries needed)
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API Error: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return {
      statusCode: 200,
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ response: aiResponse }),
    };

  } catch (error) {
    console.error("Backend Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message }),
    };
  }

};


