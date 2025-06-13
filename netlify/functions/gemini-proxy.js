// netlify/functions/gemini-proxy.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); 

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    let requestBody;
    try {
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

    const API_KEY = process.env.GEMINI_API_KEY; 
    if (!API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: GEMINI_API_KEY is not set.' }),
        };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // CRITICAL FIX PART 1: Configure the model ONCE with generationConfig here.
    // The generationConfig object itself is passed as a property.
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash", 
        generationConfig: generationConfig, // Pass the entire generationConfig object received from client
    });

    try {
        // *** CRITICAL FIX PART 2: Call generateContent ONLY with 'contents' array ***
        // The model already knows its generationConfig from the getGenerativeModel call above.
        const result = await model.generateContent(contents); 

        const responseText = result.response.text(); 

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' }, 
            body: responseText, 
        };
    } catch (e) {
        console.error('Error calling Gemini API from Netlify Function:', e.message);
        if (e.response && e.response.status && e.response.statusText) {
            console.error(`Gemini API Response Error: ${e.response.status} ${e.response.statusText} - ${e.response.headers.get('content-type') === 'application/json' ? JSON.stringify(e.response.data) : await e.response.text()}`);
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
