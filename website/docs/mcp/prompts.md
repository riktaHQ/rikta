---
sidebar_position: 4
---

# Prompts

MCP Prompts are template prompts that guide AI interactions. They help structure conversations and provide consistent starting points for common tasks.

## The @MCPPrompt Decorator

Use `@MCPPrompt` to mark a method as an MCP prompt template:

```typescript
import { Injectable } from '@riktajs/core';
import { MCPPrompt } from '@riktajs/mcp';

@Injectable()
class PromptService {
  @MCPPrompt({
    name: 'code_review',
    description: 'Generate a code review prompt',
    arguments: [
      { name: 'language', description: 'Programming language', required: true },
      { name: 'code', description: 'Code to review', required: true },
    ],
  })
  async codeReview(args: { language: string; code: string }) {
    return {
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: `Please review this ${args.language} code:\n\n\`\`\`${args.language}\n${args.code}\n\`\`\``,
        },
      }],
    };
  }
}
```

## Prompt Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | `string` | ✅ | Unique identifier for the prompt |
| `description` | `string` | ✅ | Description of what the prompt does |
| `arguments` | `MCPPromptArgument[]` | ❌ | List of prompt arguments |

### MCPPromptArgument

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ | Argument name |
| `description` | `string` | ❌ | Argument description |
| `required` | `boolean` | ❌ | Whether the argument is required |

## Return Format

Prompts must return a `GetPromptResult` object:

```typescript
interface GetPromptResult {
  description?: string;  // Optional description of the generated prompt
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text' | 'image' | 'resource';
      text?: string;
      data?: string;       // Base64 for images
      mimeType?: string;
      resource?: { uri: string; text?: string; blob?: string; mimeType?: string; };
    };
  }>;
}
```

## HTTP Context

Prompts can access the HTTP context to customize prompt generation based on user preferences, locale, or other request properties:

```typescript
import { Injectable } from '@riktajs/core';
import { MCPPrompt, MCPHandlerContext } from '@riktajs/mcp';

@Injectable()
class LocalizedPromptsService {
  @MCPPrompt({
    name: 'localized_greeting',
    description: 'Generate a greeting prompt in user language',
    arguments: [
      { name: 'name', description: 'User name', required: true },
    ],
  })
  async localizedGreeting(
    args: { name: string },
    context?: MCPHandlerContext  // Optional context parameter
  ) {
    // Get locale from request headers
    const locale = context?.request?.headers['accept-language']?.split(',')[0] || 'en';
    
    // Get user preferences from custom header
    const preferences = context?.request?.headers['x-user-preferences'];
    
    // Log prompt generation
    context?.request?.log.info({ name: args.name, locale }, 'Generating localized greeting');
    
    const greeting = this.getGreetingForLocale(locale, args.name);
    
    return {
      description: `Localized greeting for ${args.name} in ${locale}`,
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: greeting,
        },
      }],
    };
  }
  
  private getGreetingForLocale(locale: string, name: string): string {
    const greetings: Record<string, string> = {
      'en': `Hello ${name}! How can I help you today?`,
      'it': `Ciao ${name}! Come posso aiutarti oggi?`,
      'es': `¡Hola ${name}! ¿Cómo puedo ayudarte hoy?`,
      'fr': `Bonjour ${name}! Comment puis-je vous aider aujourd'hui?`,
    };
    return greetings[locale.split('-')[0]] || greetings['en'];
  }
}
```

### Context Properties

The context provides access to:

- **`context.request`** - HTTP request information
  - `headers` - Request headers (e.g., `accept-language`, custom headers)
  - `query` - Query parameters
  - `log` - Request logger

- **`context.reply`** - HTTP response customization
  - `header(name, value)` - Set custom headers

## Complete Examples

### Code Review Prompt

```typescript
import { Injectable } from '@riktajs/core';
import { MCPPrompt } from '@riktajs/mcp';

@Injectable()
class CodeReviewPromptsService {
  @MCPPrompt({
    name: 'code_review',
    description: 'Generate a comprehensive code review prompt',
    arguments: [
      { name: 'language', description: 'Programming language', required: true },
      { name: 'code', description: 'Code to review', required: true },
      { name: 'focus', description: 'Specific areas to focus on (security, performance, style)' },
    ],
  })
  async codeReview(args: { language: string; code: string; focus?: string }) {
    const focusArea = args.focus 
      ? `\n\nPlease focus specifically on: ${args.focus}` 
      : '';

    return {
      description: `Code review request for ${args.language} code`,
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please review the following ${args.language} code and provide feedback on:
- Code quality and readability
- Potential bugs or issues
- Best practices adherence
- Suggestions for improvement${focusArea}

\`\`\`${args.language}
${args.code}
\`\`\``,
        },
      }],
    };
  }

  @MCPPrompt({
    name: 'security_review',
    description: 'Generate a security-focused code review prompt',
    arguments: [
      { name: 'code', description: 'Code to review', required: true },
      { name: 'context', description: 'Application context (web, API, CLI)' },
    ],
  })
  async securityReview(args: { code: string; context?: string }) {
    const contextInfo = args.context 
      ? `\n\nApplication context: ${args.context}` 
      : '';

    return {
      description: 'Security code review request',
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Please perform a security review of this code. Look for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication/authorization issues
- Sensitive data exposure
- Input validation problems
- Insecure dependencies${contextInfo}

\`\`\`
${args.code}
\`\`\``,
        },
      }],
    };
  }
}
```

## Best Practices

1. **Clear descriptions** - Describe what the prompt does and when to use it
2. **Structured output** - Use consistent message formatting
3. **Flexible arguments** - Make non-essential arguments optional
4. **Context inclusion** - Include relevant context in the prompt
5. **Actionable requests** - End with clear asks/instructions
6. **Examples** - Include examples when helpful
