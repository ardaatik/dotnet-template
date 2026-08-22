import { ThemePicker } from '@/components/ThemePicker';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { LuPanelLeft } from 'react-icons/lu';

function getPageTitle(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/todos')) return 'Todos';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Dotnet Template';
}

const Navbar = () => {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  const title = getPageTitle(location.pathname);

  return (
    <header className="grid w-full min-w-0 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background px-4 py-4 sm:gap-3 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        data-sidebar="trigger"
        aria-label="Toggle Sidebar"
        onClick={toggleSidebar}
      >
        <LuPanelLeft className="size-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="min-w-0">
        <h1 className="truncate text-base font-medium">{title}</h1>
      </div>
      <div className="flex min-w-0 shrink-0 items-center gap-2">
        <ThemePicker />
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Navbar;
