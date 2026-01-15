import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { ContextMenuTrigger } from '@radix-ui/react-context-menu';
import { 
  Reply, 
  Copy, 
  Edit, 
  Trash2, 
  Pin, 
  Forward, 
  Bookmark, 
  Flag,
  Smile
} from 'lucide-react';
import { Message } from '@/types/chat';
import { toast } from 'sonner';

interface MessageContextMenuProps {
  children: ReactNode;
  message: Message;
  isOwnMessage: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
}

export function MessageContextMenu({
  children,
  message,
  isOwnMessage,
  onReply,
  onEdit,
  onDelete,
  onPin,
}: MessageContextMenuProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copié !');
  };

  const handleReply = () => {
    onReply?.(message);
    toast.info('Réponse au message...');
  };

  const handleEdit = () => {
    onEdit?.(message);
  };

  const handleDelete = () => {
    onDelete?.(message.id);
    toast.success('Message supprimé');
  };

  const handlePin = () => {
    onPin?.(message.id);
    toast.success('Message épinglé');
  };

  const handleAddReaction = (emoji: string) => {
    toast.success(`Réaction ${emoji} ajoutée`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover border-border">
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Smile className="w-4 h-4" />
            Ajouter une réaction
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-popover border-border">
            <div className="flex gap-1 p-2">
              {['👍', '❤️', '😂', '😮', '😢', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleReply} className="gap-2">
          <Reply className="w-4 h-4" />
          Répondre
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy} className="gap-2">
          <Copy className="w-4 h-4" />
          Copier le texte
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handlePin} className="gap-2">
          <Pin className="w-4 h-4" />
          Épingler
        </ContextMenuItem>
        
        <ContextMenuItem className="gap-2">
          <Bookmark className="w-4 h-4" />
          Enregistrer
        </ContextMenuItem>
        
        <ContextMenuItem className="gap-2">
          <Forward className="w-4 h-4" />
          Transférer
        </ContextMenuItem>
        
        {isOwnMessage && (
          <>
            <ContextMenuSeparator />
            
            <ContextMenuItem onClick={handleEdit} className="gap-2">
              <Edit className="w-4 h-4" />
              Modifier
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4" />
              Supprimer
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem className="gap-2 text-muted-foreground">
          <Flag className="w-4 h-4" />
          Signaler
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
