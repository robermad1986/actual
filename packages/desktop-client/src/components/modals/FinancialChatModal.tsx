import React from 'react';
import { Modal } from '../common/Modal';
import { ChatProvider } from '../chat/ChatProvider';
import { ChatInterface } from '../chat/ChatInterface';

export function FinancialChatModal() {
  return (
    <Modal name="financial-chat">
      <div style={{ height: '500px', width: '400px' }}>
        <ChatProvider>
          <ChatInterface />
        </ChatProvider>
      </div>
    </Modal>
  );
}
