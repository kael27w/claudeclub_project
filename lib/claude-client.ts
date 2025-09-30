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
 * Send a message to Claude and get a response
 * @param prompt - The user's message
 * @param systemPrompt - Optional system prompt for context
 * @returns Promise with Claude's response
 */
export async function sendMessage(
  prompt: string,
  systemPrompt?: string
): Promise<{
  success: boolean;
  response?: string;
  error?: string;
}> {
  try {
    // Check if API key is present
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY is not set. Please add it to your .env.local file.',
      };
    }

    const messageParams: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
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

    const response = await client.messages.create(messageParams);

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (textContent && 'text' in textContent) {
      return {
        success: true,
        response: textContent.text,
      };
    }

    return {
      success: false,
      error: 'No text content in response',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export default client;
