import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { VideoCallModal } from '@/components/VideoCallModal';

const Index = () => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>('general');
  const [isCallOpen, setIsCallOpen] = useState(false);

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
