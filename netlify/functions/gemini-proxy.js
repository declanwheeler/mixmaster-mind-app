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

    // Reconstruct generationConfig for model initialization, explicitly pulling out expected fields
    const modelGenerationConfig = {};
    if (generationConfig) {
        if (generationConfig.responseMimeType) {
            modelGenerationConfig.responseMimeType = generationConfig.responseMimeType;
        }
        if (generationConfig.responseSchema) {
            modelGenerationConfig.responseSchema = generationConfig.responseSchema;
        }
        // Add any other generationConfig properties (like temperature, topP, topK) here if they exist
        // e.g., if (generationConfig.temperature) modelGenerationConfig.temperature = generationConfig.temperature;
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Ensure this matches the model used in your App.js
        generationConfig: modelGenerationConfig, // Pass the explicitly constructed generationConfig
    });

    try {
        // Pass only the contents array. The model instance already has its generationConfig.
        const result = await model.generateContent({ contents: contents }); 
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
