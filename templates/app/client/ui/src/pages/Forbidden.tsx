import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="border-destructive max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-destructive text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don't have permission to access this resource.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you believe this is an error.
          </p>
          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go Back to Tables
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
