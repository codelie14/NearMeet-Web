import { User, Message, Channel } from '@/types/chat';

export const currentUser: User = {
  id: 'current',
  name: 'Vous',
  status: 'online',
};

export const mockUsers: User[] = [
  { id: '1', name: 'Marie Laurent', status: 'online' },
  { id: '2', name: 'Thomas Bernard', status: 'online' },
  { id: '3', name: 'Sophie Martin', status: 'away' },
  { id: '4', name: 'Lucas Dubois', status: 'busy' },
  { id: '5', name: 'Emma Petit', status: 'offline' },
  { id: '6', name: 'Hugo Moreau', status: 'online' },
];

export const mockChannels: Channel[] = [
  { id: 'general', name: 'Général', type: 'channel', unreadCount: 3 },
  { id: 'work', name: 'Travail', type: 'channel' },
  { id: 'random', name: 'Discussions', type: 'channel', unreadCount: 12 },
  { id: 'tech', name: 'Tech & Dev', type: 'channel' },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    senderId: '1',
    content: 'Salut tout le monde ! Comment ça va aujourd\'hui ? 👋',
    timestamp: new Date(Date.now() - 3600000 * 2),
    type: 'text',
  },
  {
    id: '2',
    senderId: '2',
    content: 'Super bien ! J\'ai terminé le projet hier soir.',
    timestamp: new Date(Date.now() - 3600000 * 1.5),
    type: 'text',
  },
  {
    id: '3',
    senderId: 'current',
    content: 'Excellent travail Thomas ! On peut organiser une réunion pour en discuter ?',
    timestamp: new Date(Date.now() - 3600000),
    type: 'text',
  },
  {
    id: '4',
    senderId: '1',
    content: 'Bonne idée ! Je propose 14h, ça vous convient ?',
    timestamp: new Date(Date.now() - 1800000),
    type: 'text',
  },
  {
    id: '5',
    senderId: '2',
    content: 'Voici les documents du projet',
    timestamp: new Date(Date.now() - 900000),
    type: 'file',
    fileName: 'rapport-projet.pdf',
    fileSize: '2.4 MB',
  },
  {
    id: '6',
    senderId: 'current',
    content: 'Parfait pour 14h ! Je lance un appel vidéo à ce moment-là.',
    timestamp: new Date(Date.now() - 300000),
    type: 'text',
  },
];
