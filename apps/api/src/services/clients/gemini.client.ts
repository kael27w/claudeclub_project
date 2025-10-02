/* Don't USE 
// apps/api/src/services/clients/gemini.client.ts
import { GoogleGenAI } from "@google/genai";

interface ClientResponse {
  success: boolean;
  data: string | null;
  error: string | null;
}


 * Generates content using the Google Gemini 1.5 Pro model via the official SDK,
 * following the direct generateContent method.
 * @param prompt The user's text prompt.
 * @returns A standardized response object.
 
export async function generateGeminiContent(prompt: string): Promise<ClientResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = '[GeminiClient] Error: GEMINI_API_KEY is not set.';
    console.error(errorMsg);
    return { success: false, data: null, error: 'API key is not configured.' };
  }

  try {
    console.log('[GeminiClient] Initializing with @google/genai SDK...');
    // CORRECTED: Initialize with an empty object. The SDK will find the key in process.env.
    const genAI = new GoogleGenAI(apiKey); // Passing the key here is also a valid pattern that should work.

    console.log('[GeminiClient] Sending request via genAI.getGenerativeModel...');
    
    // CORRECTED: Use the getGenerativeModel method as it is standard for specifying the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent(prompt);
    
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response text received from Gemini API.");
    }

    console.log('[GeminiClient] Successfully received response.');
    return { success: true, data: text, error: null };

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred with the Gemini SDK.";
    console.error(`[GeminiClient] SDK Error: ${errorMessage}`);
    return { success: false, data: null, error: errorMessage };
  }
}
**/