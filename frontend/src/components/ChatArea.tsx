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
import { mockMessages, mockUsers, currentUser, mockChannels } from '@/data/mockData';
import { Message, User } from '@/types/chat';

interface ChatAreaProps {
  channelId: string | null;
  onStartCall: () => void;
}

export function ChatArea({ channelId, onStartCall }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const channel = mockChannels.find((c) => c.id === channelId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: 'current',
      content: newMessage,
      timestamp: new Date(),
      type: 'text',
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        senderId: '1',
        content: 'Bien reçu ! 👍',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, response]);
    }, 2000);
  };

  const getUserById = (id: string): User => {
    if (id === 'current') return currentUser;
    return mockUsers.find((u) => u.id === id) || mockUsers[0];
  };

  const formatTime = (date: Date) => {
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
            <h2 className="font-semibold">{channel?.name || 'Général'}</h2>
            <p className="text-xs text-muted-foreground">
              {mockUsers.filter((u) => u.status === 'online').length} en ligne
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
          const user = getUserById(message.senderId);
          const isSelf = message.senderId === 'current';
          const showAvatar =
            index === 0 || messages[index - 1].senderId !== message.senderId;

          return (
            <MessageContextMenu 
              key={message.id} 
              message={message} 
              isOwnMessage={isSelf}
              onDelete={(id) => setMessages(msgs => msgs.filter(m => m.id !== id))}
            >
              <div
                className={cn(
                  'flex gap-3 animate-fade-in',
                  isSelf ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div className={cn('flex-shrink-0', !showAvatar && 'invisible')}>
                  <UserAvatar user={user} size="sm" showStatus={false} />
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
                      <span className="font-medium">{user.name}</span>
                      <span className="text-muted-foreground">{formatTime(message.timestamp)}</span>
                    </div>
                  )}
                  {message.type === 'file' ? (
                    <div className="nm-message-bubble bg-secondary flex items-center gap-3 max-w-xs">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.fileName}</p>
                        <p className="text-xs text-muted-foreground">{message.fileSize}</p>
                      </div>
                      <button className="p-2 hover:bg-secondary-foreground/10 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className={cn('nm-message-bubble', isSelf ? 'nm-message-self' : 'nm-message-other')}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </MessageContextMenu>
          );
        })}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <UserAvatar user={mockUsers[0]} size="sm" showStatus={false} />
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
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message dans #${channel?.name || 'général'}...`}
              className="w-full bg-secondary border-0 rounded-xl py-3 px-4 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
            disabled={!newMessage.trim()}
            className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground rounded-xl transition-all nm-glow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
