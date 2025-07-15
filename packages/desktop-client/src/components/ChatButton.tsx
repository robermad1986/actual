import React from 'react';
import { useDispatch } from '../redux';

interface ChatButtonProps {
  className?: string;
  variant?: 'icon' | 'button';
}

export function ChatButton({ className, variant = 'icon' }: ChatButtonProps) {
  const dispatch = useDispatch();

  const handleClick = () => {
    // @ts-ignore - Type assertion for custom modal
    dispatch({ type: 'MODAL_PUSH', modal: { name: 'financial-chat' } });
  };

  if (variant === 'button') {
    return (
      <button
        className={`button ${className || ''}`}
        onClick={handleClick}
        title="Financial Assistant"
      >
        💬 Financial Assistant
      </button>
    );
  }

  return (
    <button
      className={`bare ${className || ''}`}
      onClick={handleClick}
      title="Open Financial Assistant"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 8,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
      }}
    >
      💬
    </button>
  );
}
