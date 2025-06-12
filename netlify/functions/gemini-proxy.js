// netlify/functions/gemini-proxy.js

// These modules are expected to be in your project's package.json dependencies
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
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body received by function' }),
        };
    }

    // Extract the 'contents' array and 'generationConfig' object from the request body.
    // These are the top-level keys that App.js should be sending.
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

    // Get the generative model with the configuration passed from the client
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Ensure this matches the model used in your App.js
        generationConfig: generationConfig, // Pass the full generationConfig object
    });

    try {
        // Make the actual call to the Gemini API using the extracted 'contents'
        const result = await model.generateContent(contents); 
        const responseText = result.response.text(); // Get the raw text response from Gemini

        // Return Gemini's response back to the client (App.js)
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' }, 
            body: responseText, 
        };
    } catch (e) {
        console.error('Error calling Gemini API from Netlify Function:', e.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from Gemini API via function.', details: e.message }),
        };
    }
};
