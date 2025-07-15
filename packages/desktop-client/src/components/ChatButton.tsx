import React, { useState } from 'react';
import { Button } from '@actual-app/components/button';
import { ChatProvider } from './chat/ChatProvider';
import { ChatSidebar } from './ChatSidebar';

interface ChatButtonProps {
  variant?: 'icon' | 'button';
  style?: React.CSSProperties;
}

export function ChatButton({ variant = 'icon', style }: ChatButtonProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleClick = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      <Button
        variant="bare"
        aria-label="Open Financial Assistant"
        onPress={handleClick}
        style={{
          padding: 8,
          borderRadius: 4,
          ...style,
        }}
      >
        {variant === 'button' ? (
          <>💬 Financial Assistant</>
        ) : (
          <span style={{ fontSize: 16 }}>💬</span>
        )}
      </Button>

      <ChatProvider>
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </ChatProvider>
    </>
  );
}
