import { useState, useEffect } from 'react';

export const useChatServerStatus = () => {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);

    const checkServerStatus = async () => {
        try {
            const chatUrl = process.env.REACT_APP_CHAT_URL || 'http://localhost:3000';
            const response = await fetch(`${chatUrl}/api/ai/chat/health`, {
                method: 'GET',
                timeout: 3000, // 3 segundos de timeout
            });

            setIsOnline(response.ok);
            setLastCheck(new Date());
        } catch (error) {
            setIsOnline(false);
            setLastCheck(new Date());
        }
    };

    useEffect(() => {
        // Verificar estado inicial
        checkServerStatus();

        // Verificar cada 30 segundos
        const interval = setInterval(checkServerStatus, 30000);

        return () => clearInterval(interval);
    }, []);

    return { isOnline, lastCheck, checkServerStatus };
};
