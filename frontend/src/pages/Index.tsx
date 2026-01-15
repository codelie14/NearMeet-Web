import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { VideoCallModal } from '@/components/VideoCallModal';
import { LoginPage } from '@/components/LoginPage';
import { useUser } from '@/lib/userStore';

const Index = () => {
  const { currentUser, isLoading } = useUser();
  const [selectedChannel, setSelectedChannel] = useState<string | null>('general');
  const [isCallOpen, setIsCallOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      <Sidebar
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
        onStartCall={() => setIsCallOpen(true)}
      />
      <ChatArea channelId={selectedChannel} onStartCall={() => setIsCallOpen(true)} />
      <VideoCallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} />
    </div>
  );
};

export default Index;
