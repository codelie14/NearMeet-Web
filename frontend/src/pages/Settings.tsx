import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, User, Bell, Palette, Volume2, Shield, Info, Check, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/UserAvatar';
import { useUser } from '@/lib/userStore';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'audio' | 'privacy' | 'about';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  
  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<'online' | 'away' | 'busy' | 'offline'>('online');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [mentionNotifications, setMentionNotifications] = useState(true);
  
  // Appearance settings
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [compactMode, setCompactMode] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  
  // Audio settings
  const [masterVolume, setMasterVolume] = useState([80]);
  const [notificationVolume, setNotificationVolume] = useState([70]);
  const [inputDevice, setInputDevice] = useState('default');
  const [outputDevice, setOutputDevice] = useState('default');
  
  // Privacy settings
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);

  // Initialize state from current user
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.username);
      setStatus((currentUser.status as any) || 'online');
      setAvatarUrl(currentUser.avatar_url || '');
    }
  }, [currentUser]);

  // Apply theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profil', icon: User },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'appearance' as SettingsTab, label: 'Apparence', icon: Palette },
    { id: 'audio' as SettingsTab, label: 'Audio', icon: Volume2 },
    { id: 'privacy' as SettingsTab, label: 'Confidentialité', icon: Shield },
    { id: 'about' as SettingsTab, label: 'À propos', icon: Info },
  ];

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUser(currentUser.id, {
            username: displayName,
            status: status,
            avatar_url: avatarUrl
        });
        setCurrentUser(updatedUser);
        toast({ title: 'Profil mis à jour', description: 'Vos modifications ont été enregistrées.' });
    } catch (error) {
        console.error('Failed to update profile:', error);
        toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil.', variant: 'destructive' });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !currentUser) return;

      try {
          const uploadedFile = await api.uploadFile(file, currentUser.id);
          const fullUrl = api.getFileDownloadUrl(uploadedFile.id);
          setAvatarUrl(fullUrl);
          
          // Auto-save avatar update
          const updatedUser = await api.updateUser(currentUser.id, { avatar_url: fullUrl });
          setCurrentUser(updatedUser);
          
          toast({ title: 'Avatar mis à jour' });
      } catch (error) {
          console.error('Failed to upload avatar:', error);
          toast({ title: 'Erreur', description: "L'upload de l'avatar a échoué.", variant: 'destructive' });
      }
  };

  return (
    <div className="h-screen w-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>
        
        <div className="p-4">
          <h1 className="font-display font-bold text-xl nm-gradient-text mb-6">Paramètres</h1>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto nm-scrollbar bg-background">
        <div className="max-w-2xl mx-auto p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Profil</h2>
                <p className="text-muted-foreground">Gérez votre profil et votre statut</p>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-6">
                <UserAvatar 
                    user={{ 
                        id: currentUser?.id.toString() || '0', 
                        name: displayName || currentUser?.username || 'User', 
                        avatar: avatarUrl || currentUser?.avatar_url || '', 
                        status: status as any 
                    }} 
                    size="lg" 
                    showStatus 
                />
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Changer l'avatar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nom d'affichage</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <div className="flex gap-2">
                    {(['online', 'away', 'busy', 'offline'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          status === s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s === 'online' && 'En ligne'}
                        {s === 'away' && 'Absent'}
                        {s === 'busy' && 'Occupé'}
                        {s === 'offline' && 'Invisible'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveProfile} className="nm-glow">
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Notifications</h2>
                <p className="text-muted-foreground">Configurez vos préférences de notification</p>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Activer les notifications</p>
                    <p className="text-sm text-muted-foreground">Recevoir des notifications pour les nouveaux messages</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sons de notification</p>
                    <p className="text-sm text-muted-foreground">Jouer un son lors des nouvelles notifications</p>
                  </div>
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications du bureau</p>
                    <p className="text-sm text-muted-foreground">Afficher les notifications système</p>
                  </div>
                  <Switch checked={desktopNotifications} onCheckedChange={setDesktopNotifications} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications de mention</p>
                    <p className="text-sm text-muted-foreground">Être notifié uniquement lors des mentions</p>
                  </div>
                  <Switch checked={mentionNotifications} onCheckedChange={setMentionNotifications} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Apparence</h2>
                <p className="text-muted-foreground">Personnalisez l'apparence de l'application</p>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label>Thème</Label>
                  <div className="flex gap-2">
                    {(['dark', 'light', 'system'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          theme === t
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t === 'dark' && 'Sombre'}
                        {t === 'light' && 'Clair'}
                        {t === 'system' && 'Système'}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mode compact</p>
                    <p className="text-sm text-muted-foreground">Réduire l'espacement entre les messages</p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Afficher les avatars</p>
                    <p className="text-sm text-muted-foreground">Afficher les avatars à côté des messages</p>
                  </div>
                  <Switch checked={showAvatars} onCheckedChange={setShowAvatars} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Audio</h2>
                <p className="text-muted-foreground">Configurez vos paramètres audio et vidéo</p>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Volume principal</Label>
                    <span className="text-sm text-muted-foreground">{masterVolume[0]}%</span>
                  </div>
                  <Slider
                    value={masterVolume}
                    onValueChange={setMasterVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Volume des notifications</Label>
                    <span className="text-sm text-muted-foreground">{notificationVolume[0]}%</span>
                  </div>
                  <Slider
                    value={notificationVolume}
                    onValueChange={setNotificationVolume}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Périphérique d'entrée</Label>
                  <select 
                    value={inputDevice}
                    onChange={(e) => setInputDevice(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="default">Microphone par défaut</option>
                    <option value="headset">Casque USB</option>
                    <option value="webcam">Microphone Webcam</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Périphérique de sortie</Label>
                  <select 
                    value={outputDevice}
                    onChange={(e) => setOutputDevice(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="default">Haut-parleurs par défaut</option>
                    <option value="headset">Casque USB</option>
                    <option value="speakers">Haut-parleurs externes</option>
                  </select>
                </div>
                
                <Button variant="outline">Tester le microphone</Button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Confidentialité</h2>
                <p className="text-muted-foreground">Gérez vos paramètres de confidentialité</p>
              </div>
              
              <Separator />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Afficher le statut en ligne</p>
                    <p className="text-sm text-muted-foreground">Les autres utilisateurs peuvent voir quand vous êtes en ligne</p>
                  </div>
                  <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Autoriser les messages privés</p>
                    <p className="text-sm text-muted-foreground">Recevoir des messages directs des autres utilisateurs</p>
                  </div>
                  <Switch checked={allowDMs} onCheckedChange={setAllowDMs} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">À propos</h2>
                <p className="text-muted-foreground">Informations sur NearMeet</p>
              </div>
              
              <Separator />
              
              <div className="nm-card p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center nm-glow">
                    <span className="text-2xl font-display font-bold text-primary-foreground">NM</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold nm-gradient-text">NearMeet</h3>
                    <p className="text-muted-foreground">Version 1.0.0</p>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  NearMeet est une application de communication locale permettant aux utilisateurs 
                  de discuter en temps réel, partager des fichiers, et passer des appels vidéo/audio 
                  via un réseau local (LAN).
                </p>
                
                <div className="pt-4 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Développé avec</span> React, TypeScript, Tailwind CSS</p>
                  <p><span className="text-muted-foreground">Licence</span> MIT</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
