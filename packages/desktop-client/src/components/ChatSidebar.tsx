import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from './chat/ChatProvider';
import { useChatServerStatus } from '../hooks/chat/useChatServerStatus';
import { theme } from '@actual-app/components/theme';
import { Button } from '@actual-app/components/button';
import { SvgClose } from '@actual-app/components/icons/v1';
import { Trans } from 'react-i18next';

interface ChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onClose }) => {
    const { messages, isLoading, sendMessage, clearChat } = useChat();
    const { isOnline, checkServerStatus } = useChatServerStatus();
    const [inputValue, setInputValue] = useState('');
    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const savedWidth = localStorage.getItem('chatSidebarWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 420;
    });
    const [isResizing, setIsResizing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const minWidth = 320;
    const maxWidth = Math.min(800, window.innerWidth * 0.8);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Funcionalidad de resize
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return;

        const newWidth = window.innerWidth - e.clientX;
        const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
        setSidebarWidth(clampedWidth);
    }, [isResizing, minWidth, maxWidth]);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
        // Guardar el ancho en localStorage
        localStorage.setItem('chatSidebarWidth', sidebarWidth.toString());
    }, [sidebarWidth]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Efecto para ajustar el contenido principal
    useEffect(() => {
        if (isOpen) {
            document.body.style.paddingRight = `${sidebarWidth}px`;
            document.body.style.transition = 'padding-right 0.3s ease';
        } else {
            document.body.style.paddingRight = '0px';
        }

        return () => {
            document.body.style.paddingRight = '0px';
            document.body.style.transition = '';
        };
    }, [isOpen, sidebarWidth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        await sendMessage(inputValue);
        setInputValue('');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Chat Sidebar */}
            <div
                ref={sidebarRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: `${sidebarWidth}px`,
                    height: '100vh',
                    backgroundColor: theme.pageBackground,
                    borderLeft: `1px solid ${theme.tableBorder}`,
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: isResizing ? 'none' : 'width 0.3s ease',
                }}
            >
                {/* Resize Handle */}
                <div
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'absolute',
                        left: '-6px',
                        top: 0,
                        width: '12px',
                        height: '100%',
                        cursor: 'col-resize',
                        backgroundColor: 'transparent',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                        const handle = e.currentTarget.querySelector('div') as HTMLElement;
                        if (handle) handle.style.opacity = '0.7';
                    }}
                    onMouseLeave={(e) => {
                        const handle = e.currentTarget.querySelector('div') as HTMLElement;
                        if (handle) handle.style.opacity = isResizing ? '1' : '0.3';
                    }}
                >
                    <div
                        style={{
                            width: '3px',
                            height: '60px',
                            backgroundColor: theme.buttonPrimaryBackground,
                            borderRadius: '2px',
                            opacity: isResizing ? 1 : 0.3,
                            transition: 'opacity 0.2s ease',
                            boxShadow: isResizing ? '0 0 4px rgba(0,0,0,0.3)' : 'none',
                        }}
                    />
                </div>
                {/* Header */}
                <div
                    style={{
                        padding: '1rem',
                        borderBottom: `1px solid ${theme.tableBorder}`,
                        backgroundColor: theme.tableHeaderBackground,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: theme.pageText,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            💬 Asistente Financiero
                            <div
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: isOnline === true ? '#10b981' : isOnline === false ? '#ef4444' : '#6b7280',
                                    transition: 'background-color 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                title={isOnline === true ? 'Conectado' : isOnline === false ? 'Desconectado' : 'Verificando...'}
                                onClick={checkServerStatus}
                            />
                        </h2>
                        <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '0.8rem',
                            color: theme.pageTextSubdued,
                            opacity: 0.7
                        }}>
                            Pregúntame sobre tus finanzas
                            {isResizing && (
                                <span style={{ color: theme.buttonPrimaryBackground, marginLeft: '8px' }}>
                                    • {sidebarWidth}px
                                </span>
                            )}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button
                            variant="bare"
                            style={{
                                padding: '4px 8px',
                                fontSize: '0.7rem',
                                color: theme.pageTextSubdued
                            }}
                            onClick={clearChat}
                        >
                            Limpiar
                        </Button>
                        <Button
                            variant="bare"
                            style={{ padding: '4px' }}
                            onClick={onClose}
                        >
                            <SvgClose style={{ width: 14, height: 14 }} />
                        </Button>
                    </div>
                </div>

                {/* Messages */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        backgroundColor: theme.pageBackground,
                    }}
                >
                    {messages.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🤖</div>
                            <p style={{
                                color: theme.pageTextSubdued,
                                fontSize: '0.9rem',
                                lineHeight: 1.4
                            }}>
                                ¡Hola! Soy tu asistente financiero. <br />
                                Puedo ayudarte con:
                            </p>
                            <div style={{
                                textAlign: 'left',
                                marginTop: '1rem',
                                fontSize: '0.8rem',
                                color: theme.pageTextSubdued
                            }}>
                                • 📊 Análisis de gastos<br />
                                • 💰 Resúmenes de presupuesto<br />
                                • 📈 Tendencias financieras<br />
                                • 🔍 Búsqueda de transacciones<br />
                                • 💡 Consejos personalizados
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                style={{
                                    marginBottom: '1rem',
                                    display: 'flex',
                                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: message.role === 'user' ? theme.buttonPrimaryBackground : theme.buttonNormalBackground,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    {message.role === 'user' ? '👤' : '🤖'}
                                </div>
                                <div
                                    style={{
                                        backgroundColor: message.role === 'user'
                                            ? theme.buttonPrimaryBackground
                                            : theme.tableHeaderBackground,
                                        color: message.role === 'user'
                                            ? theme.buttonPrimaryText
                                            : theme.pageText,
                                        padding: '0.75rem',
                                        borderRadius: '12px',
                                        maxWidth: '80%',
                                        fontSize: '0.9rem',
                                        lineHeight: 1.4,
                                        border: message.role === 'assistant' ? `1px solid ${theme.tableBorder}` : 'none',
                                    }}
                                >
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                                    {message.actions && message.actions.length > 0 && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {message.actions.map((action, index) => (
                                                <Button
                                                    key={index}
                                                    variant="bare"
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        padding: '4px 8px',
                                                        backgroundColor: theme.buttonNormalBackground,
                                                        border: `1px solid ${theme.tableBorder}`,
                                                        borderRadius: '8px',
                                                    }}
                                                >
                                                    {action.title}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: theme.pageTextSubdued,
                                fontSize: '0.9rem'
                            }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: `2px solid ${theme.tableBorder}`,
                                    borderTop: `2px solid ${theme.buttonPrimaryBackground}`,
                                    borderRadius: '50%',
                                }} />
                                Pensando...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: '1rem',
                        borderTop: `1px solid ${theme.tableBorder}`,
                        backgroundColor: theme.tableHeaderBackground,
                    }}
                >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                        <textarea
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Pregúntame sobre tus finanzas..."
                            style={{
                                flex: 1,
                                minHeight: '40px',
                                maxHeight: '120px',
                                padding: '0.75rem',
                                border: `1px solid ${theme.tableBorder}`,
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                resize: 'none',
                                backgroundColor: theme.pageBackground,
                                color: theme.pageText,
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            isDisabled={!inputValue.trim() || isLoading}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                minWidth: '70px',
                            }}
                        >
                            <Trans>Enviar</Trans>
                        </Button>
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: theme.pageTextSubdued,
                        marginTop: '4px',
                        textAlign: 'center'
                    }}>
                        Enter para enviar, Shift+Enter para nueva línea
                    </div>
                </form>
            </div>
        </>
    );
};
