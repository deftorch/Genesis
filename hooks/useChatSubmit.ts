import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { useUIStore } from '@/lib/store/ui-store';
import { extractCode } from '@/lib/extract-code';
import { ImageAttachment } from '@/types';

interface UseChatSubmitOptions {
  chatId: string | null;
  selectedModel: string;
}

export function useChatSubmit({ chatId, selectedModel }: UseChatSubmitOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatStore = useChatStore();
  const ui = useUIStore();

  // Build image payloads from data URLs (exactly as in page.tsx)
  const buildImagePayloads = useCallback((images: ImageAttachment[]) => {
    return images.map((img) => {
      const url = img.url;
      if (url.startsWith('data:')) {
        const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) return { mimeType: match[1], base64: match[2] };
      }
      return { url };
    });
  }, []);

  // Sync messages from store to local state (needed after updating store)
  const syncMessages = useCallback((targetChatId: string) => {
    const chat = chatStore.chats.find((c) => c.id === targetChatId);
    if (!chat) return [];
    return chat.messages.map((msg) => ({
      type: msg.role === 'user' ? 'user' : 'ai',
      content: msg.content,
    }));
  }, [chatStore.chats]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setRegeneratingId(null);
    }
  }, []);

  const submit = useCallback(async (
    messageToSend: string,
    currentMessages: { type: string; content: string; images?: string[] }[],
    images: ImageAttachment[] = [],
    activeChatId: string | null = chatId,
  ) => {
    if (!messageToSend.trim() && images.length === 0) return;

    const imagePreviewUrls = images.map((img) => img.preview || img.url);

    const newMessages = [
      ...currentMessages,
      {
        type: 'user',
        content: messageToSend,
        images: imagePreviewUrls.length > 0 ? imagePreviewUrls : undefined,
      },
    ];

    ui.setInputMessage('');
    setIsLoading(true);
    ui.setCurrentView('chat');
    ui.setShowArtifact(false);

    // Create a new chat if it doesn't exist
    let currentChatId = activeChatId;
    if (!currentChatId) {
      const title = messageToSend.length > 40
        ? messageToSend.substring(0, 40) + '...'
        : messageToSend;
      currentChatId = chatStore.createChat(title);
      chatStore.updateModelConfig(currentChatId, { model: selectedModel as any });
      ui.setActiveChatId(currentChatId);
    }

    chatStore.addMessage(currentChatId, {
      role: 'user',
      content: messageToSend,
      tokens: Math.ceil(messageToSend.length / 4),
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const imagePayloads = buildImagePayloads(images);
      const { buildContextForAPI } = await import('@/lib/chat-summarizer');
      
      const updatedChat = chatStore.chats.find(c => c.id === currentChatId);
      const apiMessages = updatedChat 
        ? buildContextForAPI(
            updatedChat.messages,
            updatedChat.summary,
            updatedChat.lastSummarizedIndex
          )
        : newMessages.map((msg) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
          }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          currentCode: ui.editableCode || '',
          images: imagePayloads.length > 0 ? imagePayloads : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errContent = `Error: ${data.error}`;
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: errContent,
          tokens: 10,
        });
      } else {
        const aiContent = data.message?.content || 'No response received';
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: aiContent,
          tokens: Math.ceil(aiContent.length / 4),
        });

        const extracted = extractCode(aiContent);
        if (extracted) {
          if (ui.p5Code) ui.setPreviousCode(ui.p5Code);
          ui.setP5Code(extracted.code);
          ui.setEditableCode(extracted.code);
          ui.setActiveRenderer(extracted.renderer);
          ui.setActiveTab('preview');
          ui.setShowArtifact(true);

          const chat = chatStore.chats.find((c) => c.id === currentChatId);
          chatStore.addArtifact({
            chatId: currentChatId!,
            chatTitle: chat?.title || 'Untitled',
            code: extracted.code,
            renderer: extracted.renderer,
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: 'Generation stopped.',
          tokens: 0,
        });
      } else {
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: 'Failed to connect to AI service. Please try again.',
          tokens: 10,
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [chatId, selectedModel, ui, chatStore, buildImagePayloads]);

  return { submit, isLoading, stopGeneration, regeneratingId, setRegeneratingId, syncMessages };
}
