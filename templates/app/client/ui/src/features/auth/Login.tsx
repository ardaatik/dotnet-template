import { Code2 } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';

interface LocationState {
  from?: Location;
}

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await login({ email, password });

      // Store tokens and redirect
      loginContext(response.accessToken, response.refreshToken);

      // Redirect to the page they tried to visit or dashboard
      const state = location.state as LocationState;
      const destination = state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Code2 className="size-9" />
          Dotnet Template
        </h1>
      </div>

      <LoginForm onSubmit={handleLogin} error={error} />
    </div>
  );
}
