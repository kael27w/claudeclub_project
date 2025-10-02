/**
 * OpenAI (ChatGPT) API Client
 * Provides chat completion functionality using GPT-4o model
 */

interface ChatCompletionResponse {
  success: boolean;
  data: string | null;
  error: string | null;
}

/**
 * Generate a chat completion using OpenAI's GPT-4o model
 * @param prompt - The user prompt to send to the model
 * @returns Promise with standardized response object
 */
export async function generateChatCompletion(
  prompt: string
): Promise<ChatCompletionResponse> {
  try {
    // Support both OPENAI_API_KEY and CHATGPT_API_KEY
    const apiKey = process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        data: null,
        error: "OPENAI_API_KEY or CHATGPT_API_KEY is not configured",
      };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: null,
        error: `OpenAI API error: ${response.status} - ${
          errorData.error?.message || response.statusText
        }`,
      };
    }

    const data = await response.json();

    // Extract content from the first choice
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        data: null,
        error: "No content returned from OpenAI API",
      };
    }

    return {
      success: true,
      data: content,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `OpenAI client error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}
