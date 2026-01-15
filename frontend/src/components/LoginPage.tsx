/**
 * Login component for user authentication
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/lib/userStore';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useUser();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || username.length < 3) {
            toast({
                title: 'Erreur',
                description: 'Le nom d\'utilisateur doit contenir au moins 3 caractères',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        try {
            await login(username.trim());
            toast({
                title: 'Connexion réussie',
                description: `Bienvenue ${username}!`,
            });
        } catch (error: any) {
            toast({
                title: 'Erreur de connexion',
                description: error.message || 'Impossible de se connecter',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
            <Card className="w-full max-w-md nm-card">
                <CardHeader className="text-center space-y-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center mx-auto nm-glow">
                        <Users className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-display font-bold">NearMeet</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Communication locale en temps réel
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium">
                                Nom d'utilisateur
                            </label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Entrez votre nom d'utilisateur"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                className="h-12"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-12 text-base nm-glow"
                            disabled={isLoading || !username.trim()}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Aucun compte requis. Choisissez simplement un nom d'utilisateur pour commencer.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
