# TASK: [P0] Refactor and Finalize Core API Clients

**Status:** 📝 TODO
**Assignee:** Claude Code
**Priority:** Highest

## 🎯 Core Objective
To refactor our Gemini and Perplexity clients to be production-ready, stable, and use the correct libraries and API endpoints.

---

## 🏗️ Implementation Details

### Task 1: Refactor Gemini Client to Use the Official SDK

-   **Action:** You will refactor `apps/api/src/services/clients/gemini.client.ts` to use the official `@google/genai` library instead of a raw `fetch` call.
-   **Replace the entire file** with the following code:

```typescript
// apps/api/src/services/clients/gemini.client.ts
import { GoogleGenerativeAI } from "@google/genai";

interface ClientResponse {
  success: boolean;
  data: string | null;
  error: string | null;
}

export async function generateGeminiContent(prompt: string): Promise<ClientResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const errorMsg = '[GeminiClient] Error: GEMINI_API_KEY is not set.';
    console.error(errorMsg);
    return { success: false, data: null, error: 'API key is not configured.' };
  }

  try {
    console.log('[GeminiClient] Initializing with @google/genai SDK...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    console.log('[GeminiClient] Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('[GeminiClient] Successfully received response.');
    return { success: true, data: text, error: null };

  } catch (error: any) {
    console.error(`[GeminiClient] SDK Error: ${error.message}`);
    return { success: false, data: null, error: error.message };
  }
}