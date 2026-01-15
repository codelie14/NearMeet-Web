import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Hash, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel?: (channel: { name: string; description: string; isPrivate: boolean }) => void;
}

export function CreateChannelModal({ isOpen, onClose, onCreateChannel }: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Le nom du salon est requis');
      return;
    }
    
    onCreateChannel?.({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description,
      isPrivate,
    });
    
    toast.success(`Salon #${name.toLowerCase().replace(/\s+/g, '-')} créé !`);
    setName('');
    setDescription('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPrivate ? <Lock className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
            Créer un salon
          </DialogTitle>
          <DialogDescription>
            Créez un nouveau salon de discussion pour votre équipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Nom du salon</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">#</span>
              <Input
                id="channel-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="nouveau-salon"
                className="pl-7 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optionnel)</Label>
            <Textarea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert ce salon ?"
              className="bg-secondary border-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Salon privé</p>
                <p className="text-xs text-muted-foreground">
                  Seuls les membres invités pourront voir ce salon
                </p>
              </div>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleCreate} className="nm-glow">
            Créer le salon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
