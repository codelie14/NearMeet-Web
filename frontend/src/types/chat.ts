export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: UserStatus;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'audio' | 'system';
  fileName?: string;
  fileSize?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  icon?: string;
  unreadCount?: number;
  members?: string[];
}
