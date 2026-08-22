import avatarImage from '@/assets/avatar.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Permissions } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/utils/jwtUtils';
import { CheckSquare, ChevronRight, ChevronsUpDown, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ProfileDropdown from './ProfileDropdown';

export function AppSidebar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const { user, accessToken } = useAuth();

  const isTodosSectionOpen = location.pathname === '/' || location.pathname.startsWith('/todos');
  const isTodosListActive =
    location.pathname === '/' ||
    location.pathname === '/todos' ||
    (location.pathname.startsWith('/todos/') && !location.pathname.endsWith('/edit'));
  const isSettingsActive = location.pathname.startsWith('/settings');
  const canManageRoles = hasPermission(accessToken, Permissions.MANAGE_ROLES);

  const userName = user?.email?.split('@')[0] ?? 'User';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={userName}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  aria-label="Open profile menu"
                >
                  <span className="relative flex h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={avatarImage}
                      alt={userName}
                      className="aspect-square h-full w-full object-cover"
                    />
                  </span>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{userName}</span>
                    <span className="truncate text-xs">{user?.email ?? 'User'}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={4}
                className="w-64 border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md [&_[data-highlighted]]:bg-sidebar-accent [&_[data-highlighted]]:text-sidebar-accent-foreground"
              >
                <ProfileDropdown />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Todo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible defaultOpen={isTodosSectionOpen} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Tasks">
                      <CheckSquare className="size-4" />
                      <span>Tasks</span>
                      <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={isTodosListActive}>
                          <Link to="/todos">
                            <span>All Tasks</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canManageRoles && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isSettingsActive} tooltip="Settings">
                    <Link to="/settings">
                      <Settings className="size-4" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail className="after:w-px" />
    </Sidebar>
  );
}
