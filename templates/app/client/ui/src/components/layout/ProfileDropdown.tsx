import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ProfileDropdown = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div>
      {user && (
        <>
          <DropdownMenuLabel>
            <div className="text-xs text-sidebar-foreground/70">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
        </>
      )}

      <DropdownMenuItem asChild>
        <Link to="/profile" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </Link>
      </DropdownMenuItem>

      <DropdownMenuItem asChild>
        <Link to="/settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </DropdownMenuItem>

      <DropdownMenuSeparator />

      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
        <LogOut className="h-4 w-4" />
        Logout
      </DropdownMenuItem>
    </div>
  );
};

export default ProfileDropdown;
