import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleCard from '@/features/authorization/components/RoleCard';
import type { AuthorizationUser, Role, UserRoleAssignment } from '@/features/authorization/types';
import { useAuthorization } from '@/features/authorization/useAuthorization';
import { useUsers } from '@/features/users/useUsers';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ASSIGNMENTS_PAGE_SIZE = 10;
const ASSIGNMENTS_SKELETON_ROWS = 5;
const ROLES_SKELETON_COUNT = 6;

function AssignmentsTableSkeleton() {
  return (
    <>
      <table className="w-full table-fixed border-collapse text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="h-10 w-[45%] px-4 text-left font-medium text-muted-foreground">
              Identity
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">Assigned Role</th>
            <th className="h-10 w-[80px] px-4 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: ASSIGNMENTS_SKELETON_ROWS }).map((_, i) => (
            <tr key={i}>
              <td className="p-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-56" />
              </td>
              <td className="p-4 align-middle">
                <Skeleton className="h-6 w-24 rounded-full" />
              </td>
              <td className="p-4 text-right align-middle">
                <Skeleton className="ml-auto h-8 w-8 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-4 w-44" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </>
  );
}

function RoleCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 shrink-0 rounded-sm" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-8 w-[7.25rem] rounded-md" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-6 w-40 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-36 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('assignments');

  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserConfirmPassword, setNewUserConfirmPassword] = useState('');
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<AuthorizationUser[]>([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleName, setSelectedRoleName] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingAssignment, setRemovingAssignment] = useState<string | null>(null);

  const [assignmentSearchInput, setAssignmentSearchInput] = useState('');
  const [debouncedAssignmentSearch, setDebouncedAssignmentSearch] = useState('');
  const [assignmentRoleFilter, setAssignmentRoleFilter] = useState<string>('all');
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsTotalCount, setAssignmentsTotalCount] = useState(0);
  const [assignmentsNonce, setAssignmentsNonce] = useState(0);

  const { accessToken } = useAuth();
  const { registerUser } = useUsers();
  const {
    getRoles,
    getUsers,
    getUserRoleAssignments,
    createRole,
    assignRoleToUser,
    removeRoleFromUser,
  } = useAuthorization();

  const assignmentsFiltersRef = useRef({
    search: debouncedAssignmentSearch,
    role: assignmentRoleFilter,
  });

  const userOptions = useMemo(
    () =>
      users.map(user => ({
        value: user.id,
        label: user.name,
        description: user.email,
        searchText: `${user.name} ${user.email}`,
      })),
    [users]
  );

  const roleOptions = useMemo(
    () =>
      roles.map(role => ({
        value: role.name,
        label: role.name,
      })),
    [roles]
  );

  useEffect(() => {
    if (!accessToken) return;
    const loadRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const rolesData = await getRoles();
        if (rolesData) setRoles(rolesData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load roles';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    void loadRoles();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const usersData = await getUsers();
        if (usersData) setUsers(usersData);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    void loadUsers();
  }, [accessToken]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedAssignmentSearch(assignmentSearchInput), 350);
    return () => clearTimeout(t);
  }, [assignmentSearchInput]);

  useEffect(() => {
    if (assignmentRoleFilter === 'all') return;
    if (!roles.some(r => r.name === assignmentRoleFilter)) {
      setAssignmentRoleFilter('all');
    }
  }, [roles, assignmentRoleFilter]);

  const bumpAssignments = useCallback(() => setAssignmentsNonce(n => n + 1), []);

  useEffect(() => {
    const filtersChanged =
      assignmentsFiltersRef.current.search !== debouncedAssignmentSearch ||
      assignmentsFiltersRef.current.role !== assignmentRoleFilter;

    if (filtersChanged) {
      assignmentsFiltersRef.current = {
        search: debouncedAssignmentSearch,
        role: assignmentRoleFilter,
      };
      setAssignmentsPage(1);
    }
  }, [debouncedAssignmentSearch, assignmentRoleFilter]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    const load = async () => {
      setAssignmentsLoading(true);
      try {
        const data = await getUserRoleAssignments({
          page: assignmentsPage,
          pageSize: ASSIGNMENTS_PAGE_SIZE,
          q: debouncedAssignmentSearch.trim() || undefined,
          roleName: assignmentRoleFilter === 'all' ? undefined : assignmentRoleFilter,
        });
        if (!cancelled && data) {
          setUserRoleAssignments(data.items ?? []);
          setAssignmentsTotalCount(data.totalCount ?? 0);
        }
      } catch {
        if (!cancelled) {
          setUserRoleAssignments([]);
          setAssignmentsTotalCount(0);
        }
      } finally {
        if (!cancelled) setAssignmentsLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    assignmentsNonce,
    assignmentsPage,
    assignmentRoleFilter,
    debouncedAssignmentSearch,
  ]);

  const hasAssignmentFilters =
    debouncedAssignmentSearch.trim().length > 0 || assignmentRoleFilter !== 'all';
  const assignmentsTotalPages = Math.max(
    1,
    Math.ceil(assignmentsTotalCount / ASSIGNMENTS_PAGE_SIZE)
  );
  const assignmentRangeStart =
    assignmentsTotalCount === 0 ? 0 : (assignmentsPage - 1) * ASSIGNMENTS_PAGE_SIZE + 1;
  const assignmentRangeEnd = Math.min(
    assignmentsPage * ASSIGNMENTS_PAGE_SIZE,
    assignmentsTotalCount
  );

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRoleName) return;
    try {
      setIsAssigning(true);
      const success = await assignRoleToUser({
        userId: selectedUserId,
        roleName: selectedRoleName,
      });
      if (success) {
        setSelectedUserId('');
        setSelectedRoleName('');
        setIsAssignDialogOpen(false);
        bumpAssignments();
      }
    } catch (err) {
      console.error('Assign role error:', err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveRoleFromUser = async (userId: string, roleName: string) => {
    try {
      setRemovingAssignment(`${userId}-${roleName}`);
      const success = await removeRoleFromUser(userId, roleName);
      if (success) {
        if (userRoleAssignments.length === 1 && assignmentsPage > 1) {
          setAssignmentsPage(p => p - 1);
        } else {
          bumpAssignments();
        }
      }
    } catch (err) {
      console.error('Remove role error:', err);
    } finally {
      setRemovingAssignment(null);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const newRole = await createRole({ name: newRoleName.trim() });
      if (newRole) {
        setRoles(prev => [...prev, newRole]);
        setIsCreateRoleDialogOpen(false);
        setNewRoleName('');
      }
    } catch (err) {
      console.error('Create role error:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') void handleCreateRole();
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateRoleDialogOpen(open);
    if (!open) setNewRoleName('');
  };

  const handleAssignDialogOpenChange = (open: boolean) => {
    setIsAssignDialogOpen(open);
    if (!open) {
      setSelectedUserId('');
      setSelectedRoleName('');
    }
  };

  const resetCreateUserForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserConfirmPassword('');
    setCreateUserError(null);
  };

  const handleCreateUserDialogOpenChange = (open: boolean) => {
    setIsCreateUserDialogOpen(open);
    if (!open) resetCreateUserForm();
  };

  const reloadUsers = async () => {
    try {
      setUsersLoading(true);
      const usersData = await getUsers();
      if (usersData) setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) return;

    if (newUserPassword !== newUserConfirmPassword) {
      setCreateUserError('Passwords do not match');
      return;
    }

    try {
      setIsCreatingUser(true);
      setCreateUserError(null);
      const success = await registerUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        confirmPassword: newUserConfirmPassword,
      });
      if (success) {
        setIsCreateUserDialogOpen(false);
        resetCreateUserForm();
        await reloadUsers();
      }
    } catch {
      // Error toast handled in registerUser
    } finally {
      setIsCreatingUser(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load settings. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <SettingsIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your organization&apos;s security roles and user access permissions.
            </p>
          </div>
        </div>

        {activeTab === 'roles' && (
          <Dialog open={isCreateRoleDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Enter a name for the new role. You can add specific claims to it afterwards.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newRoleName">Role Name</Label>
                  <Input
                    id="newRoleName"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="e.g. Editor, Admin, Viewer"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void handleCreateRole()} disabled={!newRoleName.trim()}>
                  Create Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {activeTab === 'assignments' && (
          <div className="flex gap-2">
            <Dialog open={isCreateUserDialogOpen} onOpenChange={handleCreateUserDialogOpenChange}>
              <DialogTrigger asChild>
                <Button variant="outline" className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create User</DialogTitle>
                  <DialogDescription>
                    Register a new user account. They will be assigned the Member role by default.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {createUserError && <p className="text-sm text-destructive">{createUserError}</p>}
                  <div className="space-y-2">
                    <Label htmlFor="newUserName">Full Name</Label>
                    <Input
                      id="newUserName"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="Full name"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserEmail">Email</Label>
                    <Input
                      id="newUserEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={e => setNewUserEmail(e.target.value)}
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserPassword">Password</Label>
                    <Input
                      id="newUserPassword"
                      type="password"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newUserConfirmPassword">Confirm Password</Label>
                    <Input
                      id="newUserConfirmPassword"
                      type="password"
                      value={newUserConfirmPassword}
                      onChange={e => setNewUserConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleCreateUser()}
                    disabled={
                      isCreatingUser ||
                      !newUserName.trim() ||
                      !newUserEmail.trim() ||
                      !newUserPassword ||
                      !newUserConfirmPassword
                    }
                  >
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAssignDialogOpen} onOpenChange={handleAssignDialogOpenChange}>
              <DialogTrigger asChild>
                <Button className="shadow-sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Access
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign User Access</DialogTitle>
                  <DialogDescription>Grant a user a specific system role.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="userSelect">User</Label>
                    <SearchableSelect
                      id="userSelect"
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                      options={userOptions}
                      placeholder={usersLoading ? 'Loading...' : 'Search user...'}
                      searchPlaceholder="Search users..."
                      allowAll={false}
                      emptyMessage="No user found."
                      disabled={usersLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="roleSelect">Role</Label>
                    <SearchableSelect
                      id="roleSelect"
                      value={selectedRoleName}
                      onValueChange={setSelectedRoleName}
                      options={roleOptions}
                      placeholder={isLoading ? 'Loading...' : 'Select role...'}
                      searchPlaceholder="Search roles..."
                      allowAll={false}
                      emptyMessage="No role found."
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => void handleAssignRole()}
                    disabled={isAssigning || !selectedUserId || !selectedRoleName}
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Access'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> User Access
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Role Definitions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="w-full space-y-4 outline-none">
          <div className="flex w-full min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 shadow-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  className="h-10 w-full pl-9"
                  placeholder="Search by name or email…"
                  aria-label="Search assignments"
                  value={assignmentSearchInput}
                  onChange={e => setAssignmentSearchInput(e.target.value)}
                />
              </div>
              <Select value={assignmentRoleFilter} onValueChange={setAssignmentRoleFilter}>
                <SelectTrigger className="w-full sm:w-[220px]" aria-label="Filter by role">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-sm">
              {assignmentsLoading ? (
                <AssignmentsTableSkeleton />
              ) : assignmentsTotalCount === 0 && !hasAssignmentFilters ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium">No role assignments yet</p>
                  <p className="text-sm text-muted-foreground">
                    Use Assign Access to grant a user a role.
                  </p>
                </div>
              ) : assignmentsTotalCount === 0 && hasAssignmentFilters ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <Search className="h-10 w-10 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium">No matching assignments</p>
                  <p className="text-sm text-muted-foreground">
                    Try a different search or role filter.
                  </p>
                </div>
              ) : (
                <>
                  <table className="w-full table-fixed border-collapse text-sm">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="h-10 w-[45%] px-4 text-left font-medium text-muted-foreground">
                          Identity
                        </th>
                        <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                          Assigned Role
                        </th>
                        <th className="h-10 w-[80px] px-4 text-right font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {userRoleAssignments.map(a => (
                        <tr
                          key={`${a.userId}-${a.roleId}`}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="p-4">
                            <div className="font-medium text-foreground">{a.userName}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {a.userEmail}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary" className="bg-secondary/50 font-mono">
                              {a.roleName}
                            </Badge>
                          </td>
                          <td className="p-4 text-right align-middle">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-red-400 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                              onClick={() => void handleRemoveRoleFromUser(a.userId, a.roleName)}
                              disabled={removingAssignment === `${a.userId}-${a.roleName}`}
                            >
                              {removingAssignment === `${a.userId}-${a.roleName}` ? (
                                <span className="text-[10px] font-bold uppercase">...</span>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing{' '}
                      <span className="font-medium text-foreground">
                        {assignmentRangeStart}–{assignmentRangeEnd}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-foreground">{assignmentsTotalCount}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={assignmentsLoading || assignmentsPage <= 1}
                        onClick={() => setAssignmentsPage(p => p - 1)}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-muted-foreground">
                        Page {assignmentsPage} / {assignmentsTotalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        disabled={assignmentsLoading || assignmentsPage >= assignmentsTotalPages}
                        onClick={() => setAssignmentsPage(p => p + 1)}
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roles" className="w-full space-y-4 outline-none">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: ROLES_SKELETON_COUNT }).map((_, i) => (
                <RoleCardSkeleton key={i} />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/20 py-16 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
              <h3 className="mb-2 text-lg font-medium">No roles found</h3>
              <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
                Create your first role to get started with granular permission management.
              </p>
              <Button onClick={() => setIsCreateRoleDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Role
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roles.map(role => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onRoleUpdated={(updatedRole: Role) => {
                    setRoles(prev => prev.map(r => (r.id === updatedRole.id ? updatedRole : r)));
                  }}
                  onRoleDeleted={(deletedRoleId: string) => {
                    setRoles(prev => prev.filter(r => r.id !== deletedRoleId));
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
