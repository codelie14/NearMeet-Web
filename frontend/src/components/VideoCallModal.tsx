import { useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Users,
  MessageSquare,
  Settings,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from './UserAvatar';
import { mockUsers, currentUser } from '@/data/mockData';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoCallModal({ isOpen, onClose }: VideoCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  if (!isOpen) return null;

  const participants = [currentUser, ...mockUsers.slice(0, 3)];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl animate-scale-in">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 bg-gradient-to-b from-background to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center nm-glow">
            <Video className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-bold">Réunion d'équipe</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {participants.length} participants
              </span>
              <span>•</span>
              <span>12:34</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <Maximize2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-destructive/20 hover:text-destructive rounded-lg transition-colors text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Video Grid */}
      <div className="absolute inset-0 pt-16 pb-24 px-6">
        <div className="h-full grid grid-cols-2 gap-4">
          {participants.map((user, index) => (
            <div
              key={user.id}
              className={cn(
                'relative rounded-2xl overflow-hidden nm-glass animate-fade-in',
                index === 0 && 'col-span-2 md:col-span-1'
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Placeholder for video */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-card flex items-center justify-center">
                <UserAvatar user={user} size="lg" showStatus={false} />
              </div>

              {/* User label */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-sm font-medium">{user.name}</span>
                  {index !== 0 && (
                    <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Self indicator */}
              {user.id === 'current' && (
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md">
                  Vous
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <footer className="absolute bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-3 bg-gradient-to-t from-background via-background to-transparent px-6">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            'p-4 rounded-xl transition-all',
            isMuted
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          )}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setIsVideoOff(!isVideoOff)}
          className={cn(
            'p-4 rounded-xl transition-all',
            isVideoOff
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          )}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          onClick={() => setIsScreenSharing(!isScreenSharing)}
          className={cn(
            'p-4 rounded-xl transition-all',
            isScreenSharing
              ? 'bg-primary text-primary-foreground nm-glow'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          )}
        >
          <MonitorUp className="w-6 h-6" />
        </button>

        <button className="p-4 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all">
          <MessageSquare className="w-6 h-6" />
        </button>

        <button className="p-4 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-all">
          <Users className="w-6 h-6" />
        </button>

        <div className="w-px h-8 bg-border mx-2" />

        <button
          onClick={onClose}
          className="px-6 py-4 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-all flex items-center gap-2 font-medium"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Quitter</span>
        </button>
      </footer>
    </div>
  );
}
