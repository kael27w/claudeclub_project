// apps/api/src/services/clients/perplexity.client.ts

interface ClientResponse {
  success: boolean;
  data: string | null;
  error: string | null;
}

export async function performOnlineSearch(prompt: string): Promise<ClientResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    const errorMsg = '[PerplexityClient] Error: PERPLEXITY_API_KEY is not set.';
    console.error(errorMsg);
    return { success: false, data: null, error: 'API key is not configured.' };
  }

  const url = "[https://api.perplexity.ai/chat/completions](https://api.perplexity.ai/chat/completions)";

  const body = {
    model: "sonar-small-32k-online", // The correct model for fast, web-connected research
    messages: [
      { role: "system", content: "You are a helpful and accurate AI research assistant." },
      { role: "user", content: prompt },
    ],
  };

  try {
    console.log('[PerplexityClient] Sending request to Chat Completions API...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    
    const responseData = await response.json();

    if (!response.ok) {
        const errorMessage = responseData.error?.message || `HTTP status ${response.status}`;
        console.error(`[PerplexityClient] API Error: ${errorMessage}`);
        return { success: false, data: null, error: `API Error: ${errorMessage}` };
    }

    const content = responseData.choices?.[0]?.message?.content;
    
    if (!content) {
        return { success: false, data: null, error: "No content returned from Perplexity API." };
    }

    console.log('[PerplexityClient] Successfully received response.');
    return { success: true, data: content, error: null };

  } catch (error: any) {
    console.error(`[PerplexityClient] Network or other error: ${error.message}`);
    return { success: false, data: null, error: error.message };
  }
}