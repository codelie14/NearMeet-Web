import { useState, useEffect } from 'react';
import { Hash, Users, Settings, Video, Plus, MessageSquare, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { CreateChannelModal } from './CreateChannelModal';
import { useUser } from '@/lib/userStore';
import { api, Channel as ApiChannel, User as ApiUser } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface SidebarProps {
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
  onStartCall: () => void;
}

export function Sidebar({ selectedChannel, onSelectChannel, onStartCall }: SidebarProps) {
  const navigate = useNavigate();
  const { currentUser, logout } = useUser();
  const { toast } = useToast();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [channels, setChannels] = useState<ApiChannel[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);

  useEffect(() => {
    loadChannels();
    loadUsers();
  }, []);

  async function loadChannels() {
    try {
      const channelList = await api.getChannels();
      setChannels(channelList);
    } catch (error) {
      console.error('Failed to load channels:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les salons',
        variant: 'destructive',
      });
    }
  }

  async function loadUsers() {
    try {
      const userList = await api.getUsers();
      setUsers(userList.filter(u => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  const handleCreateChannel = async (channelData: { name: string; description: string; isPrivate: boolean }) => {
    if (!currentUser) return;
    
    try {
      await api.createChannel(channelData.name, channelData.description, currentUser.id);
      toast({
        title: 'Salon créé',
        description: `Le salon #${channelData.name} a été créé avec succès`,
      });
      loadChannels();
      setIsCreateChannelOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le salon',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: 'Déconnexion',
      description: 'Vous avez été déconnecté',
    });
  };

  const onlineUsers = users.filter((u) => u.is_online);
  const offlineUsers = users.filter((u) => !u.is_online);

  return (
    <>
      <aside className="w-72 bg-sidebar flex flex-col border-r border-border h-full">
        {/* Logo & Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center nm-glow">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg nm-gradient-text">NearMeet</h1>
              <p className="text-xs text-muted-foreground">Réseau local</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-border">
          <button
            onClick={onStartCall}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-4 rounded-lg transition-all duration-200 nm-glow animate-pulse-glow"
          >
            <Video className="w-4 h-4" />
            <span>Lancer un appel</span>
          </button>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto nm-scrollbar p-3 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Salons
              </span>
              <button
                onClick={() => setIsCreateChannelOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  isActive={selectedChannel === channel.id.toString()}
                  onClick={() => onSelectChannel(channel.id.toString())}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                En ligne — {onlineUsers.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {onlineUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
          </div>

          {offlineUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hors ligne — {offlineUsers.length}
                </span>
              </div>
              <div className="space-y-0.5 opacity-60">
                {offlineUsers.map((user) => (
                  <UserItem key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current User */}
        <div className="p-3 border-t border-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <UserAvatar
              user={{
                id: currentUser?.id.toString() || '0',
                name: currentUser?.username || 'User',
                avatar: '',
                status: 'online'
              }}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser?.username}</p>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-secondary"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onCreateChannel={handleCreateChannel}
      />
    </>
  );
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: ApiChannel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'nm-sidebar-item w-full text-left',
        isActive && 'nm-sidebar-item-active bg-primary/10 text-primary'
      )}
    >
      <Hash className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 truncate">{channel.name}</span>
    </button>
  );
}

function UserItem({ user }: { user: ApiUser }) {
  return (
    <div className="nm-sidebar-item cursor-pointer">
      <UserAvatar
        user={{
          id: user.id.toString(),
          name: user.username,
          avatar: '',
          status: user.is_online ? 'online' : 'offline'
        }}
        size="sm"
      />
      <span className="flex-1 truncate text-sm">{user.username}</span>
    </div>
  );
}
