import React from 'react';
import { useDispatch } from '../redux';

interface ChatSidebarProps {
    className?: string;
}

export function ChatSidebar({ className }: ChatSidebarProps) {
    const dispatch = useDispatch();

    const handleOpenChat = () => {
        // @ts-ignore - Type assertion for custom modal
        dispatch({ type: 'MODAL_PUSH', modal: { name: 'financial-chat' } });
    };

    return (
        <div
            className={`chat-sidebar ${className || ''}`}
            style={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                zIndex: 1000,
            }}
        >
            <button
                onClick={handleOpenChat}
                style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    fontSize: 24,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                title="Financial Assistant"
            >
                💬
            </button>
        </div>
    );
}
