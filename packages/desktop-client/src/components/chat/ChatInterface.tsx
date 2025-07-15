import { useState, type FormEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useChat } from './ChatProvider';

export function ChatInterface() {
    const { messages, isLoading, sendMessage } = useChat();
    const [inputValue, setInputValue] = useState('');
    const { t } = useTranslation();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        await sendMessage(inputValue);
        setInputValue('');
    };

    return (
        <div className="chat-interface" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`chat-message chat-message--${message.role}`}
                        style={{
                            marginBottom: '0.5rem',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                            alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}
                    >
                        <div>{message.content}</div>
                        {message.actions && message.actions.length > 0 && (
                            <div className="chat-actions" style={{ marginTop: '0.5rem' }}>
                                {message.actions.map((action, index) => (
                                    <button
                                        key={index}
                                        className="chat-action-button"
                                        style={{
                                            marginRight: '0.5rem',
                                            padding: '0.25rem 0.5rem',
                                            fontSize: '0.8rem',
                                            backgroundColor: '#1976d2',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {action.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-loading" style={{ textAlign: 'center', padding: '1rem' }}>
                        <span>💭 Thinking...</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t('Ask about your finances...')}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '1px solid #ddd',
                            borderRadius: '0.25rem'
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Trans>Send</Trans>
                    </button>
                </div>
            </form>
        </div>
    );
}
