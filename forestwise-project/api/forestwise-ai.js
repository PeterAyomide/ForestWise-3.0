// api/forestwise-ai.js

export default async function handler(req, res) {
  // 1. Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vercel automatically parses JSON bodies, so we don't need JSON.parse(event.body)
    // We just use req.body directly
    const { message, conversationHistory = [], imageData, context, speciesData } = req.body;

    // --- CONFIGURATION ---
    // PASTE YOUR GEMINI API KEY HERE
    const API_KEY = process.env.GEMINI_API_KEY || "PASTE_YOUR_GEMINI_KEY_HERE"; 
    const MODEL_NAME = "gemini-1.5-flash";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    if (!API_KEY || API_KEY === "PASTE_YOUR_GEMINI_KEY_HERE") {
      return res.status(500).json({ error: "Gemini API Key is missing." });
    }

    // --- SYSTEM PROMPT (Same as before) ---
    const speciesContext = speciesData 
      ? `REAL-TIME DATABASE ACCESS: You have access to the following trusted species database: ${JSON.stringify(speciesData)}.`
      : "DATABASE STATUS: Species database not provided for this request.";

    const systemInstruction = `
      You are ForestWise AI, an expert forestry assistant for Nigeria and West Africa.
      
      YOUR PRIME DIRECTIVE:
      1. Use the provided "REAL-TIME DATABASE" as your source of truth. 
      2. If a user asks about a species listed in the database, you must ONLY use facts from the JSON data provided.
      3. If the database lacks specific details, say "The database doesn't mention X, but generally..." and then provide general forestry knowledge.
      
      CONTEXT FROM USER'S SESSION:
      ${context || "No specific user context provided."}
      
      ${speciesContext}
    `.trim();

    // --- MAP HISTORY (Same as before) ---
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // --- ADD CURRENT MESSAGE ---
    const currentParts = [];
    if (message) currentParts.push({ text: message });
    
    if (imageData) {
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

    // --- CALL GEMINI ---
    const geminiResponse = await fetch(API_URL, {
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

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API Error:", errText);
      throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
    }

    const data = await geminiResponse.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    // Send success response
    return res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error("Handler Error:", error);
    return res.status(500).json({ error: error.message });
  }
}