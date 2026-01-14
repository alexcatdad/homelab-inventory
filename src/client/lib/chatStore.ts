import { writable, get } from 'svelte/store';
import { llmEngine, llmStatus, initializeLLM } from './llm/engine';
import { buildSystemPrompt } from './llm/prompts';
import { formatInventoryContext } from './llm/context';
import { devices, stats } from './stores';
import type { ChatCompletionMessageParam } from '@mlc-ai/web-llm';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

// Chat UI state
export const chatOpen = writable<boolean>(false);
export const chatMessages = writable<ChatMessage[]>([]);
export const chatGenerating = writable<boolean>(false);
export const chatError = writable<string | null>(null);

// Generate unique ID
function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Send a message and get streaming response
export async function sendMessage(content: string): Promise<void> {
  const engine = get(llmEngine);

  // Ensure engine is ready
  if (!engine || get(llmStatus) !== 'ready') {
    const success = await initializeLLM();
    if (!success) {
      chatError.set('Failed to initialize AI model');
      return;
    }
  }

  const currentEngine = get(llmEngine);
  if (!currentEngine) {
    chatError.set('AI model not available');
    return;
  }

  // Clear any previous errors
  chatError.set(null);

  // Add user message
  const userMessage: ChatMessage = {
    id: generateId(),
    role: 'user',
    content,
    timestamp: new Date()
  };
  chatMessages.update(msgs => [...msgs, userMessage]);

  // Add placeholder assistant message for streaming
  const assistantId = generateId();
  const assistantMessage: ChatMessage = {
    id: assistantId,
    role: 'assistant',
    content: '',
    timestamp: new Date(),
    isStreaming: true
  };
  chatMessages.update(msgs => [...msgs, assistantMessage]);
  chatGenerating.set(true);

  try {
    // Build context from current inventory
    const currentDevices = get(devices);
    const currentStats = get(stats);
    const inventoryContext = formatInventoryContext(currentDevices, currentStats);
    const systemPrompt = buildSystemPrompt(inventoryContext);

    // Build conversation history
    const history = get(chatMessages)
      .filter(m => m.id !== assistantId) // Exclude the placeholder
      .slice(-10) // Keep last 10 messages for context
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history
    ];

    // Stream the response
    const stream = await currentEngine.chat.completions.create({
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;

      // Update the message content
      chatMessages.update(msgs =>
        msgs.map(m =>
          m.id === assistantId
            ? { ...m, content: fullContent }
            : m
        )
      );
    }

    // Mark streaming complete
    chatMessages.update(msgs =>
      msgs.map(m =>
        m.id === assistantId
          ? { ...m, isStreaming: false }
          : m
      )
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to generate response';
    chatError.set(errorMessage);

    // Remove the failed assistant message
    chatMessages.update(msgs => msgs.filter(m => m.id !== assistantId));
  } finally {
    chatGenerating.set(false);
  }
}

// Clear chat history
export function clearChat(): void {
  chatMessages.set([]);
  chatError.set(null);
}

// Open/close chat panel
export function openChat(): void {
  chatOpen.set(true);
}

export function closeChat(): void {
  chatOpen.set(false);
}

export function toggleChat(): void {
  chatOpen.update(open => !open);
}
