// netlify/functions/gemini-proxy.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // Required for older Node.js versions, safe to keep.

exports.handler = async (event, context) => {
    // Ensure only POST requests are processed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    let requestBody;
    try {
        // Safely parse the JSON payload sent from the client (App.js)
        // This requestBody will contain 'contents' and 'generationConfig' as top-level keys
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body received by function' }),
        };
    }

    // Extract the 'contents' array and 'generationConfig' object from the request body.
    const { contents, generationConfig } = requestBody; 

    // Retrieve your actual Gemini API key from Netlify's secure environment variables.
    const API_KEY = process.env.GEMINI_API_KEY; 
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is not set.' }),
        };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Get the generative model. Do NOT pass generationConfig here, as it's passed directly to generateContent.
    // This is the model configuration for the *client library*, not the API payload.
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Ensure this matches the model used in your App.js
    });

    try {
        // *** CRITICAL FIX: Build the payload for model.generateContent with explicit structure ***
        // This ensures each property is assigned directly from the parsed requestBody
        // and sent in the exact format the Gemini API expects.
        const apiCallPayload = {
            contents: contents, // This is the array of { role: "user", parts: [...] }
        };

        // Explicitly reconstruct generationConfig with its expected fields
        if (generationConfig) {
            apiCallPayload.generationConfig = {};
            if (generationConfig.responseMimeType) {
                apiCallPayload.generationConfig.responseMimeType = generationConfig.responseMimeType;
            }
            if (generationConfig.responseSchema) {
                apiCallPayload.generationConfig.responseSchema = generationConfig.responseSchema;
            }
            // If you add other generationConfig properties in App.js (like temperature, topP, topK),
            // you would need to add them here too:
            // e.g., if (generationConfig.temperature) apiCallPayload.generationConfig.temperature = generationConfig.temperature;
        }

        // Call generateContent with the precisely constructed payload
        const result = await model.generateContent(apiCallPayload); 
        const responseText = result.response.text(); 

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' }, 
            body: responseText, 
        };
    } catch (e) {
        console.error('Error calling Gemini API from Netlify Function:', e.message);
        if (e.response && e.response.status) {
            const errorDetails = await e.response.text();
            console.error(`Gemini API Response Error: ${e.response.status} ${e.response.statusText} - Details: ${errorDetails}`);
            return {
                statusCode: e.response.status,
                body: JSON.stringify({ 
                    error: `Gemini API Error: ${e.response.statusText}`, 
                    details: errorDetails 
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from Gemini API via function.', details: e.message }),
        };
    }
};
