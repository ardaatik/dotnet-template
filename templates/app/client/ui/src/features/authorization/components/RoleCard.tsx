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
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthorization } from '@/features/authorization/useAuthorization';
import { Edit, Plus, Shield, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AvailableClaims, Role, RoleClaim } from '../types';

interface RoleCardProps {
  role: Role;
  onRoleUpdated?: (updatedRole: Role) => void;
  onRoleDeleted?: (deletedRoleId: string) => void;
}

export default function RoleCard({ role, onRoleUpdated, onRoleDeleted }: RoleCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddClaimDialogOpen, setIsAddClaimDialogOpen] = useState(false);
  const [editName, setEditName] = useState(role.name);
  const [newClaimType, setNewClaimType] = useState('');
  const [newClaimValue, setNewClaimValue] = useState('');

  // Local state for claims and available claims
  const [claims, setClaims] = useState<RoleClaim[]>([]);
  const [availableClaims, setAvailableClaims] = useState<AvailableClaims>({});
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [availableClaimsLoading, setAvailableClaimsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingClaim, setIsAddingClaim] = useState(false);
  const [isRemovingClaim, setIsRemovingClaim] = useState(false);

  const {
    getRoleClaims,
    getAvailableClaims,
    updateRole,
    deleteRole,
    addClaimToRole,
    removeClaimFromRole,
  } = useAuthorization();

  // Load claims and available claims on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setClaimsLoading(true);
        setAvailableClaimsLoading(true);

        const [claimsData, availableClaimsData] = await Promise.all([
          getRoleClaims(role.id),
          getAvailableClaims(),
        ]);

        if (claimsData) setClaims(claimsData);
        if (availableClaimsData) setAvailableClaims(availableClaimsData);
      } catch (error) {
        console.error('Failed to load role data:', error);
      } finally {
        setClaimsLoading(false);
        setAvailableClaimsLoading(false);
      }
    };

    loadData();
  }, [role.id]); // Remove getRoleClaims and getAvailableClaims from dependency array

  const handleUpdateRole = async () => {
    if (editName.trim() && editName !== role.name) {
      try {
        setIsUpdating(true);
        const updatedRole = await updateRole(role.id, { name: editName.trim() });
        if (updatedRole && onRoleUpdated) {
          onRoleUpdated(updatedRole);
        }
        setIsEditDialogOpen(false);
      } catch (error) {
        console.error('Failed to update role:', error);
      } finally {
        setIsUpdating(false);
      }
    } else {
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteRole = async () => {
    try {
      setIsDeleting(true);
      const success = await deleteRole(role.id);
      if (success && onRoleDeleted) {
        onRoleDeleted(role.id);
      }
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete role:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClaim = async () => {
    if (newClaimType && newClaimValue) {
      try {
        setIsAddingClaim(true);
        const newClaim = await addClaimToRole(role.id, {
          claimType: newClaimType,
          claimValue: newClaimValue,
        });
        if (newClaim) {
          setClaims(prev => [...prev, newClaim]);
        }
        setIsAddClaimDialogOpen(false);
        setNewClaimType('');
        setNewClaimValue('');
      } catch (error) {
        console.error('Failed to add claim:', error);
      } finally {
        setIsAddingClaim(false);
      }
    }
  };

  const handleRemoveClaim = async (claimType: string, claimValue: string) => {
    try {
      setIsRemovingClaim(true);
      const success = await removeClaimFromRole(role.id, claimType, claimValue);
      if (success) {
        setClaims(prev =>
          prev.filter(claim => !(claim.claimType === claimType && claim.claimValue === claimValue))
        );
      }
    } catch (error) {
      console.error('Failed to remove claim:', error);
    } finally {
      setIsRemovingClaim(false);
    }
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditName(role.name);
    }
  };

  const handleAddClaimDialogOpenChange = (open: boolean) => {
    setIsAddClaimDialogOpen(open);
    if (!open) {
      setNewClaimType('');
      setNewClaimValue('');
    }
  };

  // Convert backend data to the format expected by the selects
  const claimTypes = Object.keys(availableClaims).map(key => ({
    value: key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  }));

  const availableClaimValues = newClaimType ? availableClaims[newClaimType] || [] : [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {role.name}
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>Update the role name.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Enter role name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRole} disabled={isUpdating || !editName.trim()}>
                  {isUpdating ? 'Updating...' : 'Update Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Role</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the role "{role.name}"? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteRole} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Claims</h4>
          <Dialog open={isAddClaimDialogOpen} onOpenChange={handleAddClaimDialogOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Claim
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Claim to Role</DialogTitle>
                <DialogDescription>
                  Add a new permission claim to the "{role.name}" role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="claimType">Claim Type</Label>
                  {availableClaimsLoading ? (
                    <Skeleton className="mt-2 h-10 w-full" />
                  ) : (
                    <SearchableSelect
                      id="claimType"
                      value={newClaimType}
                      onValueChange={value => {
                        setNewClaimType(value);
                        setNewClaimValue('');
                      }}
                      options={claimTypes}
                      allowAll={false}
                      placeholder="Select claim type"
                      searchPlaceholder="Search claim types..."
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="claimValue">Claim Value</Label>
                  <SearchableSelect
                    id="claimValue"
                    value={newClaimValue}
                    onValueChange={setNewClaimValue}
                    options={availableClaimValues.map(claimValue => ({
                      value: claimValue,
                      label: claimValue,
                    }))}
                    allowAll={false}
                    placeholder="Select claim value"
                    searchPlaceholder="Search claim values..."
                    disabled={!newClaimType || availableClaimsLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddClaimDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddClaim}
                  disabled={isAddingClaim || !newClaimType || !newClaimValue}
                >
                  {isAddingClaim ? 'Adding...' : 'Add Claim'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          {claimsLoading ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-sm text-muted-foreground">No claims assigned</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {claims.map((claim: RoleClaim) => (
                <Badge
                  key={`${claim.claimType}-${claim.claimValue}`}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {claim.claimType}:{claim.claimValue}
                  <button
                    onClick={() => handleRemoveClaim(claim.claimType, claim.claimValue)}
                    className="ml-1 hover:text-destructive"
                    disabled={isRemovingClaim}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
