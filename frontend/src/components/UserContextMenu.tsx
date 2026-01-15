import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { ContextMenuTrigger } from '@radix-ui/react-context-menu';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  UserPlus, 
  UserMinus, 
  Volume2, 
  VolumeX,
  Ban,
  Shield,
  AtSign
} from 'lucide-react';
import { User } from '@/types/chat';
import { toast } from 'sonner';

interface UserContextMenuProps {
  children: ReactNode;
  user: User;
  onStartDM?: (userId: string) => void;
  onStartCall?: (userId: string) => void;
  onStartVideoCall?: (userId: string) => void;
}

export function UserContextMenu({
  children,
  user,
  onStartDM,
  onStartCall,
  onStartVideoCall,
}: UserContextMenuProps) {
  const handleDM = () => {
    onStartDM?.(user.id);
    toast.success(`Conversation avec ${user.name}`);
  };

  const handleCall = () => {
    onStartCall?.(user.id);
    toast.success(`Appel en cours vers ${user.name}...`);
  };

  const handleVideoCall = () => {
    onStartVideoCall?.(user.id);
    toast.success(`Appel vidéo vers ${user.name}...`);
  };

  const handleMention = () => {
    toast.info(`@${user.name} mentionné`);
  };

  const handleMute = () => {
    toast.success(`${user.name} est maintenant en sourdine`);
  };

  const handleBlock = () => {
    toast.success(`${user.name} a été bloqué`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover border-border">
        <div className="px-2 py-2 border-b border-border mb-1">
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.status === 'online' ? 'En ligne' : user.status === 'away' ? 'Absent' : user.status === 'busy' ? 'Occupé' : 'Hors ligne'}</p>
        </div>
        
        <ContextMenuItem onClick={handleDM} className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Envoyer un message
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleMention} className="gap-2">
          <AtSign className="w-4 h-4" />
          Mentionner
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCall} className="gap-2">
          <Phone className="w-4 h-4" />
          Appeler
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleVideoCall} className="gap-2">
          <Video className="w-4 h-4" />
          Appel vidéo
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem className="gap-2">
          <UserPlus className="w-4 h-4" />
          Ajouter en ami
        </ContextMenuItem>
        
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2">
            <Shield className="w-4 h-4" />
            Modération
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-popover border-border">
            <ContextMenuItem onClick={handleMute} className="gap-2">
              <VolumeX className="w-4 h-4" />
              Mettre en sourdine
            </ContextMenuItem>
            <ContextMenuItem onClick={handleBlock} className="gap-2 text-destructive focus:text-destructive">
              <Ban className="w-4 h-4" />
              Bloquer
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
