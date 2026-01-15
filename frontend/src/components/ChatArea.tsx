import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Video,
  Phone,
  MoreVertical,
  Hash,
  FileText,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { MessageContextMenu } from './MessageContextMenu';
import { useUser } from '@/lib/userStore';
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket';
import { api, Message as ApiMessage } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ChatAreaProps {
  channelId: string | null;
  onStartCall: () => void;
}

interface Message {
  id: number;
  user_id: number;
  username: string;
  content: string;
  message_type: string;
  file_id?: number;
  created_at: string;
}

export function ChatArea({ channelId, onStartCall }: ChatAreaProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Array<{ user_id: number; username: string }>>([]);
  const [currentChannel, setCurrentChannel] = useState<{ id: number; name: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // WebSocket connection
  const { isConnected, sendChatMessage, sendTypingIndicator } = useWebSocket({
    userId: currentUser?.id || 0,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      toast({ title: 'Connecté', description: 'Connexion au chat établie' });
      loadMessageHistory();
    },
    onDisconnect: () => {
      toast({ title: 'Déconnecté', description: 'Connexion au chat perdue', variant: 'destructive' });
    },
  });

  function handleWebSocketMessage(message: WSMessage) {
    if (message.type === 'message') {
      const newMsg: Message = {
        id: message.id!,
        user_id: message.user_id!,
        username: message.username!,
        content: message.content!,
        message_type: message.message_type || 'text',
        file_id: message.file_id,
        created_at: message.timestamp!,
      };
      setMessages((prev) => [...prev, newMsg]);
    } else if (message.type === 'user_joined') {
      setOnlineUsers(message.online_users || []);
      toast({
        title: 'Utilisateur connecté',
        description: `${message.username} a rejoint le chat`,
      });
    } else if (message.type === 'user_left') {
      setOnlineUsers(message.online_users || []);
    } else if (message.type === 'typing') {
      if (message.is_typing) {
        setTypingUsers((prev) => new Set(prev).add(message.user_id!));
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(message.user_id!);
          return newSet;
        });
      }
    }
  }

  async function loadChannelDetails() {
      if (!channelId) return;
      try {
          const id = parseInt(channelId);
          if (isNaN(id)) return;
          const channel = await api.getChannel(id);
          setCurrentChannel(channel);
      } catch (error) {
          console.error("Failed to load channel details:", error);
      }
  }

  async function loadMessageHistory() {
    if (!channelId) return;
    try {
      const channelIdNum = parseInt(channelId);
      if (isNaN(channelIdNum)) return;

      const history = await api.getMessages(channelIdNum);
      setMessages(history.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        username: msg.username || 'Unknown',
        content: msg.content,
        message_type: msg.message_type,
        file_id: msg.file_id,
        created_at: msg.created_at,
      })));
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  }

  useEffect(() => {
    if (currentUser && channelId) {
      loadChannelDetails();
      loadMessageHistory();
    }
  }, [channelId, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || !currentUser || !channelId) return;

    const channelIdNum = parseInt(channelId);
    if (isNaN(channelIdNum)) return;

    sendChatMessage(channelIdNum, newMessage.trim());
    setNewMessage('');

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(channelIdNum, false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!channelId) return;
    const channelIdNum = parseInt(channelId);
    if (isNaN(channelIdNum)) return;

    // Send typing indicator
    sendTypingIndicator(channelIdNum, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(channelIdNum, false);
    }, 2000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!channelId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mx-auto mb-6 nm-glow">
            <Hash className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Bienvenue sur NearMeet</h2>
          <p className="text-muted-foreground max-w-md">
            Sélectionnez un salon ou un utilisateur pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Hash className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-semibold">{currentChannel?.name || 'Chargement...'}</h2>
            <p className="text-xs text-muted-foreground">
              {onlineUsers.length} en ligne {!isConnected && '(déconnecté)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onStartCall}
            className="p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={onStartCall}
            className="p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto nm-scrollbar p-6 space-y-4">
        {messages.map((message, index) => {
          const isSelf = message.user_id === currentUser?.id;
          const showAvatar =
            index === 0 || messages[index - 1].user_id !== message.user_id;

          return (
            <MessageContextMenu
              key={message.id}
              message={{ 
                id: message.id.toString(), 
                senderId: message.user_id.toString(), 
                content: message.content, 
                timestamp: new Date(message.created_at), 
                type: (message.message_type as 'text' | 'file' | 'audio' | 'system') || 'text' 
              }}
              isOwnMessage={isSelf}
              onDelete={(id) => {
                // TODO: Implement message deletion
                console.log('Delete message:', id);
              }}
            >
              <div
                className={cn(
                  'flex gap-3 animate-fade-in',
                  isSelf ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={cn('flex-shrink-0', !showAvatar && 'invisible')}>
                  <UserAvatar
                    user={{ id: message.user_id.toString(), name: message.username, avatar: '', status: 'online' }}
                    size="sm"
                    showStatus={false}
                  />
                </div>
                <div
                  className={cn('flex flex-col gap-1', isSelf ? 'items-end' : 'items-start')}
                >
                  {showAvatar && (
                    <div
                      className={cn(
                        'flex items-center gap-2 text-xs',
                        isSelf && 'flex-row-reverse'
                      )}
                    >
                      <span className="font-medium">{message.username}</span>
                      <span className="text-muted-foreground">{formatTime(message.created_at)}</span>
                    </div>
                  )}
                  <div className={cn('nm-message-bubble', isSelf ? 'nm-message-self' : 'nm-message-other')}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            </MessageContextMenu>
          );
        })}

        {typingUsers.size > 0 && (
          <div className="flex gap-3 animate-fade-in">
            <div className="nm-message-bubble nm-message-other">
              <div className="flex gap-1.5 py-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button className="p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message dans #${channelId === 'general' ? 'général' : channelId}...`}
              className="w-full bg-secondary border-0 rounded-xl py-3 px-4 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              disabled={!isConnected}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button className="p-2 hover:bg-secondary-foreground/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Smile className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-secondary-foreground/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <Mic className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || !isConnected}
            className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground rounded-xl transition-all nm-glow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
