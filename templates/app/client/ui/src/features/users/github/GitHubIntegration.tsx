import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import type { GitHubUserProfile } from './useGitHub';
import { useGitHub } from './useGitHub';

interface GitHubIntegrationProps {
  profile: GitHubUserProfile | null;
  isLoading: boolean;
  error: string | null;
  onTokenSubmit: () => Promise<void>;
  onTokenRevoke: () => Promise<void>;
}

export const GitHubIntegration: React.FC<GitHubIntegrationProps> = ({
  profile,
  isLoading,
  error,
  onTokenSubmit,
  onTokenRevoke,
}) => {
  const github = useGitHub();
  const [showForm, setShowForm] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [personalAccessToken, setPersonalAccessToken] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await github.submitPAT(personalAccessToken, expiresInDays);
      await onTokenSubmit();
      setShowForm(false);
      setPersonalAccessToken('');
    } catch (error) {
      console.error('Failed to submit GitHub PAT:', error);
    }
  };

  const handleRevoke = async () => {
    try {
      if (!profile) return;

      const revokeLink = profile.links.find(link => link.rel === 'revoke-token')!;
      await github.revokePAT(revokeLink);
      await onTokenRevoke();
    } catch (error) {
      console.error('Failed to revoke GitHub PAT:', error);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-lg" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {profile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="h-16 w-16 rounded-full"
              />
              <div>
                <h3 className="font-medium">{profile.name || profile.login}</h3>
                {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                  <span>{profile.public_repos} repos</span>
                  <span>{profile.followers} followers</span>
                  <span>{profile.following} following</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {profile.links?.find(link => link.rel === 'store-token') && (
                <Button variant="link" className="h-auto p-0" onClick={() => setShowForm(true)}>
                  Update Token
                </Button>
              )}
              {profile.links?.find(link => link.rel === 'revoke-token') && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-destructive hover:text-destructive"
                  onClick={handleRevoke}
                >
                  Revoke Token
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-muted-foreground">
              GitHub integration is not configured. Add your Personal Access Token to enable
              integration.
            </p>
            <Button onClick={() => setShowForm(true)}>Configure GitHub Integration</Button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="github-pat">Personal Access Token</Label>
              <div className="relative">
                <Input
                  id="github-pat"
                  type={showToken ? 'text' : 'password'}
                  value={personalAccessToken}
                  onChange={e => setPersonalAccessToken(e.target.value)}
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="github-expires">Expires In (Days)</Label>
              <Input
                id="github-expires"
                type="number"
                value={expiresInDays}
                onChange={e => setExpiresInDays(Number(e.target.value))}
                min={1}
                max={365}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Token</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
