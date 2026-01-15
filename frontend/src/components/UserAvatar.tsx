import { User, UserStatus } from '@/types/chat';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const statusColors: Record<UserStatus, string> = {
  online: 'bg-nm-online',
  away: 'bg-nm-away',
  busy: 'bg-nm-busy',
  offline: 'bg-nm-offline',
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const statusSizeClasses = {
  sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  md: 'w-3 h-3 -bottom-0.5 -right-0.5',
  lg: 'w-3.5 h-3.5 bottom-0 right-0',
};

export function UserAvatar({ user, size = 'md', showStatus = true }: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    'from-cyan-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];
  
  const colorIndex = user.id.charCodeAt(0) % colors.length;

  return (
    <div className="relative inline-flex">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-gradient-to-br text-white',
            sizeClasses[size],
            colors[colorIndex]
          )}
        >
          {initials}
        </div>
      )}
      {showStatus && (
        <span
          className={cn(
            'absolute rounded-full border-2 border-background',
            statusSizeClasses[size],
            statusColors[user.status]
          )}
        />
      )}
    </div>
  );
}
