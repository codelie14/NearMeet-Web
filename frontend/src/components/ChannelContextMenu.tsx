import { ReactNode } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ContextMenuTrigger } from '@radix-ui/react-context-menu';
import { 
  Edit, 
  Trash2, 
  Bell, 
  BellOff, 
  Pin, 
  Copy, 
  Settings,
  Users,
  LogOut
} from 'lucide-react';
import { Channel } from '@/types/chat';
import { toast } from 'sonner';

interface ChannelContextMenuProps {
  children: ReactNode;
  channel: Channel;
  onEdit?: (channel: Channel) => void;
  onDelete?: (channelId: string) => void;
  onMute?: (channelId: string) => void;
  onPin?: (channelId: string) => void;
}

export function ChannelContextMenu({
  children,
  channel,
  onEdit,
  onDelete,
  onMute,
  onPin,
}: ChannelContextMenuProps) {
  const handleEdit = () => {
    onEdit?.(channel);
  };

  const handleDelete = () => {
    onDelete?.(channel.id);
    toast.success(`Salon "${channel.name}" supprimé`);
  };

  const handleMute = () => {
    onMute?.(channel.id);
    toast.success(`Notifications désactivées pour #${channel.name}`);
  };

  const handlePin = () => {
    onPin?.(channel.id);
    toast.success(`Salon #${channel.name} épinglé`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`nearmeet://channel/${channel.id}`);
    toast.success('Lien copié !');
  };

  const handleLeave = () => {
    toast.success(`Vous avez quitté #${channel.name}`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-popover border-border">
        <div className="px-2 py-2 border-b border-border mb-1">
          <p className="font-medium text-sm flex items-center gap-1">
            <span className="text-muted-foreground">#</span>
            {channel.name}
          </p>
          {channel.unreadCount && (
            <p className="text-xs text-primary">{channel.unreadCount} messages non lus</p>
          )}
        </div>
        
        <ContextMenuItem onClick={() => toast.info('Marquer comme lu')} className="gap-2">
          <Bell className="w-4 h-4" />
          Marquer comme lu
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleMute} className="gap-2">
          <BellOff className="w-4 h-4" />
          Couper les notifications
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handlePin} className="gap-2">
          <Pin className="w-4 h-4" />
          Épingler le salon
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleCopyLink} className="gap-2">
          <Copy className="w-4 h-4" />
          Copier le lien
        </ContextMenuItem>
        
        <ContextMenuItem className="gap-2">
          <Users className="w-4 h-4" />
          Voir les membres
        </ContextMenuItem>
        
        <ContextMenuItem className="gap-2">
          <Settings className="w-4 h-4" />
          Paramètres du salon
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={handleEdit} className="gap-2">
          <Edit className="w-4 h-4" />
          Renommer
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleLeave} className="gap-2 text-amber-500 focus:text-amber-500">
          <LogOut className="w-4 h-4" />
          Quitter le salon
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleDelete} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4" />
          Supprimer le salon
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
