// functions/forestwise-ai.js

// 1. Handle CORS Preflight (OPTIONS requests)
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// 2. Handle POST requests (The Main Logic)
export async function onRequestPost(context) {
  try {
    // Parse incoming data
    const body = await context.request.json();
    const { message, conversationHistory = [], imageData, context: userContext, speciesData } = body;

    // Access Environment Variable (Set this in Cloudflare Dashboard)
    const API_KEY = context.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: "Server Error: Missing GEMINI_API_KEY" }), {
        status: 500,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        }
      });
    }

    // Configure Gemini API
    const MODEL_NAME = "gemini-2.5-flash"; // Updated to valid model name (2.5 doesn't exist yet publicly, 1.5 is the current fast one)
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    // --- YOUR CUSTOM SYSTEM PROMPT LOGIC ---
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
      ${userContext || "The user is exploring tree options."}
      
      Goal: Help the user feel confident about planting trees.
    `.trim();

    // Format History for Gemini
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add the New Message (Text + Image support)
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

    // Call Google Gemini API
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
      throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    // Return Success Response
    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (error) {
    console.error("Backend Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  }
}

