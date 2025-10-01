import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude API Client
 * Handles all interactions with the Anthropic Claude API
 */

// Initialize the Anthropic client
// Note: API key is loaded from environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('⚠️  ANTHROPIC_API_KEY is not set in environment variables!');
  console.error('Please add it to your .env.local file');
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Test the Claude API connection
 * @returns Promise with connection status
 */
export async function testClaudeConnection(): Promise<{
  success: boolean;
  message: string;
  model?: string;
}> {
  try {
    // Simple test message to verify API key works
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Reply with "Hello" to confirm connection.',
        },
      ],
    });

    // Check if we got a valid response
    if (response.content && response.content.length > 0) {
      return {
        success: true,
        message: 'Claude API connection successful',
        model: response.model,
      };
    }

    return {
      success: false,
      message: 'Unexpected response format from Claude API',
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return {
        success: false,
        message: `Claude API Error: ${error.message}`,
      };
    }

    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Send a message to Claude and get a response (throws on error)
 * @param prompt - The user's message
 * @param systemPrompt - Optional system prompt for context
 * @param maxTokens - Optional max tokens (default: 1024)
 * @returns Promise with Claude's response text
 * @throws Error if API call fails
 */
export async function sendMessage(
  prompt: string,
  systemPrompt?: string,
  maxTokens: number = 1024
): Promise<string> {
  // Check if API key is present
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Please add it to your .env.local file.');
  }

  const messageParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: maxTokens,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  };

  // Add system prompt if provided
  if (systemPrompt) {
    messageParams.system = systemPrompt;
  }

  try {
    const response = await client.messages.create(messageParams);

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && 'text' in textContent) {
      return textContent.text;
    }

    throw new Error('No text content in Claude response');
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API Error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Legacy sendMessage for backwards compatibility
 * @deprecated Use sendMessage instead (now throws errors)
 */
export async function sendMessageSafe(
  prompt: string,
  systemPrompt?: string
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    const response = await sendMessage(prompt, systemPrompt);
    return {
      success: true,
      response,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default client;
