import { useState } from 'react';
import { Hash, Users, Settings, Video, Plus, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { UserContextMenu } from './UserContextMenu';
import { ChannelContextMenu } from './ChannelContextMenu';
import { CreateChannelModal } from './CreateChannelModal';
import { mockUsers, mockChannels, currentUser } from '@/data/mockData';
import { Channel, User } from '@/types/chat';

interface SidebarProps {
  selectedChannel: string | null;
  onSelectChannel: (channelId: string) => void;
  onStartCall: () => void;
}

export function Sidebar({ selectedChannel, onSelectChannel, onStartCall }: SidebarProps) {
  const navigate = useNavigate();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const onlineUsers = mockUsers.filter((u) => u.status === 'online');
  const otherUsers = mockUsers.filter((u) => u.status !== 'online');

  const handleCreateChannel = (channel: { name: string; description: string; isPrivate: boolean }) => {
    console.log('Creating channel:', channel);
    // TODO: Add channel to state/database
  };

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
              {mockChannels.map((channel) => (
                <ChannelContextMenu key={channel.id} channel={channel}>
                  <div>
                    <ChannelItem
                      channel={channel}
                      isActive={selectedChannel === channel.id}
                      onClick={() => onSelectChannel(channel.id)}
                    />
                  </div>
                </ChannelContextMenu>
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
                <UserContextMenu key={user.id} user={user} onStartVideoCall={() => onStartCall()}>
                  <div>
                    <UserItem user={user} />
                  </div>
                </UserContextMenu>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Hors ligne — {otherUsers.length}
              </span>
            </div>
            <div className="space-y-0.5 opacity-60">
              {otherUsers.map((user) => (
                <UserContextMenu key={user.id} user={user}>
                  <div>
                    <UserItem user={user} />
                  </div>
                </UserContextMenu>
              ))}
            </div>
          </div>
        </div>

        {/* Current User */}
        <div className="p-3 border-t border-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3">
            <UserAvatar user={currentUser} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">En ligne</p>
            </div>
            <button 
              onClick={() => navigate('/settings')}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary"
            >
              <Settings className="w-4 h-4" />
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
  channel: Channel;
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
      {channel.unreadCount && (
        <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}

function UserItem({ user }: { user: User }) {
  return (
    <div className="nm-sidebar-item cursor-pointer">
      <UserAvatar user={user} size="sm" />
      <span className="flex-1 truncate text-sm">{user.name}</span>
    </div>
  );
}
