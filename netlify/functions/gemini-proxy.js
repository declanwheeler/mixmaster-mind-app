// netlify/functions/gemini-proxy.js

// These modules must be installed as dependencies in your package.json
// (we'll ensure this in step 7 if you haven't already).
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); 

exports.handler = async (event, context) => {
    // Only allow POST requests to this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    let requestBody;
    try {
        // Parse the incoming request body from the client (App.js)
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body in function request' }),
        };
    }

    // Extract the 'contents' and 'generationConfig' from the request body
    // These directly match what the Google Generative AI library expects
    const { contents, generationConfig } = requestBody; 

    // Retrieve API key securely from Netlify Environment Variables
    // This 'process.env.GEMINI_API_KEY' points to the variable you set in Netlify dashboard
    const API_KEY = process.env.GEMINI_API_KEY; 
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is not set in Netlify environment variables.' }),
        };
    }

    // Initialize the Google Generative AI model with the API key
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Configure the model using the generationConfig received from the client
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", // Using gemini-2.0-flash as specified in previous steps
        generationConfig: generationConfig, // Pass the entire generationConfig object
    });

    try {
        // Make the call to the Google Gemini API with the 'contents' array
        const result = await model.generateContent(contents); 
        const responseText = result.response.text(); // Get the raw text response from Gemini (which should be JSON)

        // Return Gemini's response back to the client (App.js)
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' }, 
            body: responseText, 
        };
    } catch (e) {
        console.error('Gemini API Error caught in Netlify Function:', e.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from Gemini API via function.', details: e.message }),
        };
    }
};
