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
    const isIntentionalDisconnect = useRef(false);

    // Use refs for callbacks to avoid re-connecting when they change
    const onMessageRef = useRef(onMessage);
    const onConnectRef = useRef(onConnect);
    const onDisconnectRef = useRef(onDisconnect);
    const onErrorRef = useRef(onError);

    // Update refs when props change
    useEffect(() => {
        onMessageRef.current = onMessage;
        onConnectRef.current = onConnect;
        onDisconnectRef.current = onDisconnect;
        onErrorRef.current = onError;
    }, [onMessage, onConnect, onDisconnect, onError]);

    const connect = useCallback(() => {
        // Don't connect if no userId provided
        if (!userId) {
            return;
        }

        // Check if we have an active or connecting socket
        if (wsRef.current) {
            if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
                return;
            }
            // Close any other state (CLOSING or CLOSED) just to be safe before overwriting
            wsRef.current.close();
        }

        // Reset intentional disconnect flag
        isIntentionalDisconnect.current = false;

        console.log(`Attempting to connect to WebSocket for user ${userId}...`);
        const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${userId}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            setReconnectAttempts(0);
            onConnectRef.current?.();
        };

        ws.onmessage = (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                onMessageRef.current?.(message);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            onErrorRef.current?.(error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            
            // Only call onDisconnect if we were previously connected
            if (wsRef.current) {
                onDisconnectRef.current?.();
            }

            // Attempt to reconnect with exponential backoff ONLY if not intentional
            if (!isIntentionalDisconnect.current && reconnectAttempts < 5) {
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                console.log(`Reconnecting in ${delay}ms...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    setReconnectAttempts((prev) => prev + 1);
                }, delay);
            }

            wsRef.current = null;
        };

        wsRef.current = ws;
    }, [userId, reconnectAttempts]);

    const disconnect = useCallback(() => {
        isIntentionalDisconnect.current = true;
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = undefined;
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

    // Handle connection/disconnection on mount/unmount/userId change
    useEffect(() => {
        if (userId) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [userId, connect, disconnect]);

    return {
        isConnected,
        sendMessage,
        sendChatMessage,
        sendTypingIndicator,
        reconnect: connect,
        disconnect,
    };
};
