import { API_BASE_URL } from '@/api/config';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/utils/fetchUtils';
import { toast } from 'sonner';
import type {
  AssignClaimToUserDto,
  AssignRoleToUserDto,
  AuthorizationUser,
  AvailableClaims,
  CreateClaimDto,
  CreateRoleDto,
  GetUserRoleAssignmentsParams,
  Role,
  RoleClaim,
  UpdateRoleDto,
  UserClaim,
  UserRoleAssignmentsPage,
} from './types';

const API_BASE = `${API_BASE_URL}/authorization`;

export function useAuthorization() {
  const { accessToken } = useAuth();

  // Role management functions
  const getRoles = async (): Promise<Role[] | null> => {
    if (!accessToken) return null;

    try {
      return await fetchWithAuth<Role[]>(`${API_BASE}/roles`, accessToken);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      throw error; // Re-throw so components can handle it
    }
  };

  const getRole = async (roleId: string): Promise<Role | null> => {
    if (!accessToken || !roleId) return null;

    try {
      return await fetchWithAuth<Role>(`${API_BASE}/roles/${roleId}`, accessToken);
    } catch (error) {
      console.error('Failed to fetch role:', error);
      throw error;
    }
  };

  const createRole = async (data: CreateRoleDto): Promise<Role | null> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      const result = await fetchWithAuth<Role>(`${API_BASE}/roles`, accessToken, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Role created successfully');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create role');
      throw error;
    }
  };

  const updateRole = async (roleId: string, data: UpdateRoleDto): Promise<Role | null> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      const result = await fetchWithAuth<Role>(`${API_BASE}/roles/${roleId}`, accessToken, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      toast.success('Role updated successfully');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
      throw error;
    }
  };

  const deleteRole = async (roleId: string): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(`${API_BASE}/roles/${roleId}`, accessToken, {
        method: 'DELETE',
      });
      toast.success('Role deleted successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
      return false;
    }
  };

  // Role claims management
  const getRoleClaims = async (roleId: string): Promise<RoleClaim[] | null> => {
    if (!accessToken || !roleId) return null;

    try {
      return await fetchWithAuth<RoleClaim[]>(`${API_BASE}/roles/${roleId}/claims`, accessToken);
    } catch (error) {
      console.error('Failed to fetch role claims:', error);
      throw error;
    }
  };

  const addClaimToRole = async (
    roleId: string,
    data: CreateClaimDto
  ): Promise<RoleClaim | null> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      const result = await fetchWithAuth<RoleClaim>(
        `${API_BASE}/roles/${roleId}/claims`,
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      toast.success('Claim added to role successfully');
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to add claim to role');
      throw error;
    }
  };

  const removeClaimFromRole = async (
    roleId: string,
    claimType: string,
    claimValue: string
  ): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(
        `${API_BASE}/roles/${roleId}/claims?claimType=${encodeURIComponent(claimType)}&claimValue=${encodeURIComponent(claimValue)}`,
        accessToken,
        {
          method: 'DELETE',
        }
      );
      toast.success('Claim removed from role successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove claim from role');
      return false;
    }
  };

  // Available claims metadata
  const getAvailableClaims = async (): Promise<AvailableClaims | null> => {
    if (!accessToken) return null;

    try {
      return await fetchWithAuth<AvailableClaims>(`${API_BASE}/claims/available`, accessToken);
    } catch (error) {
      console.error('Failed to fetch available claims:', error);
      throw error;
    }
  };

  // User role management
  const getUserRoles = async (userId: string): Promise<string[] | null> => {
    if (!accessToken || !userId) return null;

    try {
      return await fetchWithAuth<string[]>(`${API_BASE}/users/${userId}/roles`, accessToken);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
      throw error;
    }
  };

  const assignRoleToUser = async (data: AssignRoleToUserDto): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(`${API_BASE}/users/roles`, accessToken, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Role assigned to user successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign role to user');
      return false;
    }
  };

  const removeRoleFromUser = async (userId: string, roleName: string): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(`${API_BASE}/users/${userId}/roles/${roleName}`, accessToken, {
        method: 'DELETE',
      });
      toast.success('Role removed from user successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove role from user');
      return false;
    }
  };

  const getUsers = async (): Promise<AuthorizationUser[] | null> => {
    if (!accessToken) return null;

    try {
      return await fetchWithAuth<AuthorizationUser[]>(`${API_BASE}/users`, accessToken);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  };

  const getUserRoleAssignments = async (
    params: GetUserRoleAssignmentsParams = {}
  ): Promise<UserRoleAssignmentsPage | null> => {
    if (!accessToken) return null;

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
    if (params.q) searchParams.set('q', params.q);
    if (params.roleName) searchParams.set('roleName', params.roleName);

    const query = searchParams.toString();
    const url = `${API_BASE}/users/roles/assignments${query ? `?${query}` : ''}`;

    try {
      return await fetchWithAuth<UserRoleAssignmentsPage>(url, accessToken);
    } catch (error) {
      console.error('Failed to fetch user role assignments:', error);
      throw error;
    }
  };

  // User claims management
  const getUserClaims = async (userId: string): Promise<UserClaim[] | null> => {
    if (!accessToken || !userId) return null;

    try {
      return await fetchWithAuth<UserClaim[]>(`${API_BASE}/users/${userId}/claims`, accessToken);
    } catch (error) {
      console.error('Failed to fetch user claims:', error);
      throw error;
    }
  };

  const assignClaimToUser = async (data: AssignClaimToUserDto): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(`${API_BASE}/users/claims`, accessToken, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast.success('Claim assigned to user successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign claim to user');
      return false;
    }
  };

  const removeClaimFromUser = async (
    userId: string,
    claimType: string,
    claimValue: string
  ): Promise<boolean> => {
    if (!accessToken) throw new Error('Not authenticated');

    try {
      await fetchWithAuth(
        `${API_BASE}/users/${userId}/claims?claimType=${encodeURIComponent(claimType)}&claimValue=${encodeURIComponent(claimValue)}`,
        accessToken,
        {
          method: 'DELETE',
        }
      );
      toast.success('Claim removed from user successfully');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove claim from user');
      return false;
    }
  };

  return {
    // Role management
    getRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,

    // Role claims
    getRoleClaims,
    addClaimToRole,
    removeClaimFromRole,

    // Available claims
    getAvailableClaims,

    // User roles
    getUserRoles,
    getUsers,
    getUserRoleAssignments,
    assignRoleToUser,
    removeRoleFromUser,

    // User claims
    getUserClaims,
    assignClaimToUser,
    removeClaimFromUser,
  };
}
