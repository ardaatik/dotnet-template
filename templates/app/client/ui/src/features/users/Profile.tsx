import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Edit3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useUsers, type UserProfile } from './useUsers';

export default function Profile() {
  const user = useUsers();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [userData] = await Promise.all([user.getProfile()]);

      if (userData) {
        setProfile(userData);
        setNewName(userData.name);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load profile data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const updateLink = profile.links?.find(link => link.rel === 'update-profile');
    if (!updateLink) {
      setError('Update operation not available');
      return;
    }

    try {
      setError(null);
      const success = await user.updateProfile(newName, updateLink);
      if (success) {
        await loadData();
        setIsEditing(false);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again later.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-64" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) return null;

  const canUpdateProfile = profile.links?.some(link => link.rel === 'update-profile');

  return (
    <div className="container mx-auto px-4 py-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Profile</CardTitle>
            {!isEditing && canUpdateProfile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                aria-label="Edit profile"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="leading-none"
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewName(profile.name);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="leading-none">
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Name</Label>
                <div className="text-sm">{profile.name}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email</Label>
                <div className="text-sm">{profile.email}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Member Since</Label>
                <div className="text-sm">{format(new Date(profile.createdAtUtc), 'PPP')}</div>
              </div>
              {profile.updatedAtUtc && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Last Updated</Label>
                  <div className="text-sm">{format(new Date(profile.updatedAtUtc), 'PPP')}</div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
