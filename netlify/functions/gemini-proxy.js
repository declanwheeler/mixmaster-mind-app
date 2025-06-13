// netlify/functions/gemini-proxy.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); 

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
        // This requestBody contains 'contents' and 'generationConfig' as top-level keys
        requestBody = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON body received by function' }),
        };
    }

    // Destructure the parts we need from the requestBody for the Gemini API call
    const { contents, generationConfig } = requestBody; 

    // Retrieve your actual Gemini API key securely from Netlify's environment variables.
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
        model: "gemini-2.0-flash", 
        // Pass the entire generationConfig object as is
        generationConfig: generationConfig, 
    });

    try {
        // *** CRITICAL FIX HERE: Pass contents and generationConfig as properties of a single object ***
        // The generateContent method expects a single GenerateContentRequest object.
        const result = await model.generateContent({ 
            contents: contents, 
            generationConfig: generationConfig 
        }); 

        const responseText = result.response.text(); 

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' }, 
            body: responseText, 
        };
    } catch (e) {
        console.error('Error calling Gemini API from Netlify Function:', e.message);
        // Also check if 'e.response' exists for more detailed API errors
        if (e.response && e.response.status && e.response.statusText) {
            console.error(`Gemini API Response Error: ${e.response.status} ${e.response.statusText}`);
            return {
                statusCode: e.response.status,
                body: JSON.stringify({ 
                    error: `Gemini API Error: ${e.response.statusText}`, 
                    details: e.message 
                }),
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to get response from Gemini API via function.', details: e.message }),
        };
    }
};
