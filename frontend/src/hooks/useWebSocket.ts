/**
 * WebSocket hook for real-time chat communication
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export interface WSMessage {
    type: string;
    id?: number;
    user_id?: number;
    username?: string;
    channel_id?: number;
    content?: string;
    message_type?: string;
    file_id?: number;
    timestamp?: string;
    online_users?: Array<{ user_id: number; username: string }>;
    is_typing?: boolean;
}

interface UseWebSocketOptions {
    userId: number;
    onMessage?: (message: WSMessage) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Event) => void;
}

export const useWebSocket = ({
    userId,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
}: UseWebSocketOptions) => {
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${userId}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setReconnectAttempts(0);
            onConnect?.();
        };

        ws.onmessage = (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                onMessage?.(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            onError?.(error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            onDisconnect?.();

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < 5) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`Reconnecting in ${delay}ms...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    setReconnectAttempts((prev) => prev + 1);
                    connect();
                }, delay);
            }
        };

        wsRef.current = ws;
    }, [userId, onMessage, onConnect, onDisconnect, onError, reconnectAttempts]);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    const sendMessage = useCallback((message: Partial<WSMessage>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
        }
    }, []);

    const sendChatMessage = useCallback((channelId: number, content: string, messageType: string = 'text', fileId?: number) => {
        sendMessage({
            type: 'message',
            channel_id: channelId,
            content,
            message_type: messageType,
            file_id: fileId,
        });
    }, [sendMessage]);

    const sendTypingIndicator = useCallback((channelId: number, isTyping: boolean) => {
        sendMessage({
            type: 'typing',
            channel_id: channelId,
            is_typing: isTyping,
        });
    }, [sendMessage]);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected,
        sendMessage,
        sendChatMessage,
        sendTypingIndicator,
        reconnect: connect,
        disconnect,
    };
};
