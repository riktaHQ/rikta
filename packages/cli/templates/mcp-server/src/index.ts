/**
 * Rikta MCP Server Entry Point
 *
 * This is a minimal MCP (Model Context Protocol) server that demonstrates
 * how to expose your services to AI assistants like Claude and GPT.
 *
 * The server includes:
 * - A tool (say_hello) that AI can invoke
 * - A resource (hello://greeting) that AI can read
 * - A prompt template (hello_prompt) for AI interactions
 */
import { Rikta } from '@riktajs/core';
import { registerMCPServer } from '@riktajs/mcp';

async function bootstrap(): Promise<void> {
  // Create the Rikta application
  const app = await Rikta.create();

  // Register the MCP server
  await registerMCPServer(app, {
    serverInfo: {
      name: process.env.MCP_SERVER_NAME || 'rikta-mcp-server',
      version: process.env.MCP_SERVER_VERSION || '1.0.0',
    },
    instructions: 'A minimal MCP server with hello world examples. ' +
      'Use the say_hello tool to greet someone, ' +
      'read the hello://greeting resource for greeting data, ' +
      'or use the hello_prompt template for generating greetings.',
    enableSSE: true,
  });

  // Start the server
  await app.listen();
}

bootstrap().catch(console.error);
