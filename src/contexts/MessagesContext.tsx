import React, { createContext, useContext, useState, useCallback } from 'react';
import { Conversation } from '@/hooks/useMessages';

interface MessagesContextType {
  isOpen: boolean;
  openMessages: () => void;
  closeMessages: () => void;
  toggleMessages: () => void;
  selectedConversation: Conversation | null;
  selectConversation: (conversation: Conversation | null) => void;
  openConversation: (conversation: Conversation) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const openMessages = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeMessages = useCallback(() => {
    setIsOpen(false);
    // Reset selection after close animation
    setTimeout(() => setSelectedConversation(null), 300);
  }, []);

  const toggleMessages = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const selectConversation = useCallback((conversation: Conversation | null) => {
    setSelectedConversation(conversation);
  }, []);

  const openConversation = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsOpen(true);
  }, []);

  return (
    <MessagesContext.Provider
      value={{
        isOpen,
        openMessages,
        closeMessages,
        toggleMessages,
        selectedConversation,
        selectConversation,
        openConversation,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}
