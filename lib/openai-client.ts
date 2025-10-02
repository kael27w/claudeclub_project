/**
 * OpenAI Client Wrapper
 * Simple wrapper around OpenAI API for destination intelligence
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Send a message to OpenAI GPT-4o and get a response
 * @param userPrompt - The user's prompt
 * @param systemPrompt - Optional system prompt for instructions
 * @param maxTokens - Maximum tokens to generate (default: 2000)
 * @returns The AI's response text
 */
export async function sendOpenAIMessage(
  userPrompt: string,
  systemPrompt?: string,
  maxTokens: number = 2000
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const messages: OpenAIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: userPrompt });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI API');
    }

    // Remove markdown code blocks if present (OpenAI often wraps JSON in ```json...```)
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return content;
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    throw error;
  }
}

/**
 * Test OpenAI connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await sendOpenAIMessage('Say "Hello from OpenAI!"');
    console.log('[OpenAI] Connection test successful:', response);
    return true;
  } catch (error) {
    console.error('[OpenAI] Connection test failed:', error);
    return false;
  }
}
