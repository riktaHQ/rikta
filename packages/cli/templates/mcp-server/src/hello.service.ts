/**
 * Hello World MCP Service
 *
 * This service demonstrates the three core MCP components:
 * - @MCPTool: Callable functions for AI assistants
 * - @MCPResource: Data providers for AI assistants
 * - @MCPPrompt: Prompt templates for AI interactions
 */
import { Injectable, z } from '@riktajs/core';
import { MCPTool, MCPResource, MCPPrompt } from '@riktajs/mcp';

@Injectable()
export class HelloService {
  /**
   * MCP Tool: Say Hello
   *
   * A simple tool that greets the user by name.
   * AI assistants can invoke this tool to generate personalized greetings.
   */
  @MCPTool({
    name: 'say_hello',
    description: 'Say hello to someone. Returns a friendly greeting message.',
    inputSchema: z.object({
      name: z.string()
        .describe('The name of the person to greet')
        .optional()
        .default('World'),
    }),
  })
  async sayHello(params: { name?: string }): Promise<{
    content: Array<{ type: 'text'; text: string }>;
  }> {
    const { name = 'World' } = params;

    return {
      content: [{
        type: 'text' as const,
        text: `Hello, ${name}! Welcome to Rikta MCP. 🚀`,
      }],
    };
  }

  /**
   * MCP Resource: Greeting Resource
   *
   * A resource that provides greeting data.
   * AI assistants can read this resource to get greeting information.
   */
  @MCPResource({
    uriPattern: 'hello://greeting',
    name: 'Hello Greeting',
    description: 'A friendly greeting resource that provides hello world data',
    mimeType: 'application/json',
  })
  async getGreeting(uri: string): Promise<{
    contents: Array<{
      uri: string;
      text: string;
      mimeType: string;
    }>;
  }> {
    const greetingData = {
      message: 'Hello, World!',
      framework: 'Rikta',
      protocol: 'MCP',
      timestamp: new Date().toISOString(),
    };

    return {
      contents: [{
        uri,
        text: JSON.stringify(greetingData, null, 2),
        mimeType: 'application/json',
      }],
    };
  }

  /**
   * MCP Prompt: Hello Prompt Template
   *
   * A prompt template that generates greeting prompts.
   * AI assistants can use this template to structure their greeting responses.
   */
  @MCPPrompt({
    name: 'hello_prompt',
    description: 'A prompt template for generating friendly greetings',
    arguments: [
      {
        name: 'name',
        description: 'The name of the person to greet',
        required: false,
      },
      {
        name: 'style',
        description: 'The greeting style (formal, casual, friendly)',
        required: false,
      },
    ],
  })
  async helloPrompt(args: {
    name?: string;
    style?: string;
  }): Promise<{
    messages: Array<{
      role: 'user' | 'assistant';
      content: { type: 'text'; text: string };
    }>;
  }> {
    const { name = 'friend', style = 'friendly' } = args;

    let greeting: string;
    switch (style) {
      case 'formal':
        greeting = `Good day, ${name}. I hope this message finds you well.`;
        break;
      case 'casual':
        greeting = `Hey ${name}! What's up?`;
        break;
      case 'friendly':
      default:
        greeting = `Hello ${name}! It's great to meet you! 👋`;
        break;
    }

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please greet ${name} in a ${style} way.`,
          },
        },
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: greeting,
          },
        },
      ],
    };
  }
}
