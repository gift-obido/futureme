import React, { createContext, useContext, useMemo } from 'react';
import { AIClient } from './AIClient';
import { MvpMockAIClient } from './MvpMockAIClient';

const AIContext = createContext<AIClient | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const client = useMemo(() => new MvpMockAIClient(), []);

  return <AIContext.Provider value={client}>{children}</AIContext.Provider>;
};

export const useAI = (): AIClient => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
