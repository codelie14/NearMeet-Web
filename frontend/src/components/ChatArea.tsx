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
  StopCircle,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { MessageContextMenu } from './MessageContextMenu';
import { useUser } from '@/lib/userStore';
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👋', '🤔', '👀', '🚀', '💯'];

export function ChatArea({ channelId, onStartCall }: ChatAreaProps) {
  const { currentUser } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Array<{ user_id: number; username: string }>>([]);
  const [currentChannel, setCurrentChannel] = useState<{ id: number; name: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // WebSocket connection
  const { isConnected, sendChatMessage, sendTypingIndicator } = useWebSocket({
    userId: currentUser?.id || 0,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      // toast({ title: 'Connecté', description: 'Connexion au chat établie' });
      loadChannelDetails();
      loadMessageHistory();
    },
    onDisconnect: () => {
      // toast({ title: 'Déconnecté', description: 'Connexion au chat perdue', variant: 'destructive' });
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
    } else if (message.type === 'message_deleted') {
      // Handle deleted message from broadcast
      if (message.message_id) {
          setMessages((prev) => prev.filter(m => m.id !== message.message_id));
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser || !channelId) return;

    try {
        const uploadedFile = await api.uploadFile(file, currentUser.id);
        const channelIdNum = parseInt(channelId);
        
        // Send file message via WebSocket
        sendChatMessage(channelIdNum, file.name, 'file', uploadedFile.id);
        toast({ title: 'Fichier envoyé', description: file.name });
    } catch (error) {
        console.error('File upload failed:', error);
        toast({ title: 'Erreur', description: "L'envoi du fichier a échoué", variant: 'destructive' });
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleRecording = async () => {
      if (isRecording) {
            stopRecording();
      } else {
            startRecording();
      }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        
        if (!currentUser || !channelId) return;
        
        try {
            const uploadedFile = await api.uploadFile(audioFile, currentUser.id);
            const channelIdNum = parseInt(channelId);
            sendChatMessage(channelIdNum, 'Message vocal', 'audio', uploadedFile.id);
             toast({ title: 'Message vocal envoyé' });
        } catch (error) {
            console.error('Audio upload failed:', error);
             toast({ title: 'Erreur', description: "L'envoi du vocal a échoué", variant: 'destructive' });
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({ title: 'Erreur', description: "Impossible d'accéder au microphone", variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
      try {
          await api.deleteMessage(parseInt(messageId));
          // Optimistic update
          setMessages(prev => prev.filter(m => m.id.toString() !== messageId));
          toast({ title: 'Message supprimé' });
      } catch (error) {
          console.error("Failed to delete message:", error);
          toast({ title: 'Erreur', description: 'Impossible de supprimer le message', variant: 'destructive' });
      }
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
              onDelete={handleDeleteMessage}
            >
              <div
                className={cn(
                  'flex gap-3 animate-fade-in group',
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
                  className={cn('flex flex-col gap-1 max-w-[70%]', isSelf ? 'items-end' : 'items-start')}
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
                    {message.message_type === 'text' && (
                        <div className="text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-0 prose-pre:bg-black/20 prose-pre:p-2 prose-pre:rounded">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                    {message.message_type === 'file' && message.file_id && (
                        <div className="flex items-center gap-3 p-1">
                            <div className="w-10 h-10 rounded bg-background/20 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate max-w-[150px]">{message.content}</span>
                                <a 
                                    href={api.getFileDownloadUrl(message.file_id)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs opacity-80 hover:underline flex items-center gap-1"
                                >
                                    <Download className="w-3 h-3" /> Télécharger
                                </a>
                            </div>
                        </div>
                    )}
                    {message.message_type === 'audio' && message.file_id && (
                        <div className="flex items-center gap-2 min-w-[200px]">
                            <audio controls className="h-8 w-full max-w-[240px] rounded">
                                <source src={api.getFileDownloadUrl(message.file_id)} type="audio/webm" />
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    )}
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
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
        />
        <div className="flex items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            title="Envoyer un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isRecording ? "Enregistrement en cours..." : `Message dans #${currentChannel?.name || channelId}...`}
              className={cn(
                  "w-full bg-secondary border-0 rounded-xl py-3 px-4 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
                  isRecording && "ring-2 ring-red-500/50 bg-red-500/5 pl-10"
              )}
              disabled={!isConnected && !isRecording}
            />
            {isRecording && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse block" />
                </div>
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                    <button 
                        className="p-2 hover:bg-secondary-foreground/10 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        title="Emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-popover border-border shadow-lg rounded-xl">
                    <div className="grid grid-cols-6 gap-2">
                        {COMMON_EMOJIS.map(emoji => (
                            <button 
                                key={emoji}
                                onClick={() => setNewMessage(prev => prev + emoji)}
                                className="text-xl hover:bg-secondary rounded p-1 transition-colors"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </PopoverContent>
              </Popover>
              
              <button 
                onClick={toggleRecording}
                className={cn(
                    "p-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground",
                    isRecording 
                        ? "bg-red-500 text-white hover:bg-red-600 animate-pulse" 
                        : "hover:bg-secondary-foreground/10"
                )}
                title={isRecording ? "Arrêter l'enregistrement" : "Enregistrer un message vocal"}
              >
                {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !isRecording) || !isConnected}
            className="p-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground rounded-xl transition-all nm-glow"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
