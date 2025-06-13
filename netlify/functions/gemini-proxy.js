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
    // These are what App.js sends to the proxy.
    const { contents, generationConfig } = requestBody; 

    // Retrieve your actual Gemini API key from Netlify's secure environment variables.
    const API_KEY = process.env.GEMINI_API_KEY; 
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is not set.' }),
        };
    }

    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Get the generative model. 
    // We pass the model ID here. generationConfig details will be passed *with* the content.
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Ensure this matches the model used in your App.js
    });

    // *** CRITICAL FIX: Reconstruct the payload EXACTLY as generateContent expects it ***
    // This bypasses any potential issues with direct object references or unique serialization
    let geminiApiPayload = {};

    // Reconstruct 'contents' explicitly
    if (contents && Array.isArray(contents)) {
        geminiApiPayload.contents = contents.map(contentItem => {
            if (contentItem && contentItem.role && Array.isArray(contentItem.parts)) {
                return {
                    role: contentItem.role,
                    parts: contentItem.parts.map(part => {
                        // Assume parts are simple text objects for now based on context
                        return { text: part.text };
                    })
                };
            }
            return contentItem; // Fallback if structure is unexpected
        });
    } else {
        // If contents is missing or not an array, this is a client-side issue, or unexpected.
        // We'll let Gemini's API validation handle it if it's genuinely missing,
        // but for this specific error, we assume 'contents' exists but is malformed.
        geminiApiPayload.contents = []; // Provide an empty array to prevent further crashes if it's truly bad
    }

    // Reconstruct 'generationConfig' explicitly, ensuring expected fields are top-level within it
    if (generationConfig && typeof generationConfig === 'object') {
        geminiApiPayload.generationConfig = {
            responseMimeType: generationConfig.responseMimeType,
            responseSchema: generationConfig.responseSchema,
            // Add other optional generationConfig properties if they exist and are relevant
            // e.g., temperature: generationConfig.temperature,
            // topP: generationConfig.topP,
            // topK: generationConfig.topK,
        };
    } else {
        // Provide a default empty generationConfig if it's missing, to satisfy API's expectation
        geminiApiPayload.generationConfig = {};
    }

    try {
        // Call generateContent with the meticulously constructed payload
        const result = await model.generateContent(geminiApiPayload); 
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
