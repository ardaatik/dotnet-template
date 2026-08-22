import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMsal } from '@azure/msal-react';
import { Code2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface LocationState {
  from?: Location;
}

const entraClientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const entraAuthority = import.meta.env.VITE_ENTRA_AUTHORITY;
const isEntraConfigured = Boolean(entraClientId && entraAuthority);

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { inProgress } = useMsal();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isMsalReady = inProgress === 'none';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoading(true);

      await login();

      const state = location.state as LocationState;
      const destination = state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Code2 className="size-9" />
          Dotnet Template
        </h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your Microsoft account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEntraConfigured && (
            <Alert variant="destructive">
              <AlertDescription>
                Entra is not configured. Copy <code>client/ui/.env.example</code> to{' '}
                <code>.env</code>, set <code>VITE_ENTRA_CLIENT_ID</code> and{' '}
                <code>VITE_ENTRA_AUTHORITY</code>, then restart the dev server.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={() => void handleLogin()}
            disabled={isLoading || !isMsalReady || !isEntraConfigured}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
