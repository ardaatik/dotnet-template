export interface Role {
  id: string;
  name: string;
  normalizedName: string;
  concurrencyStamp?: string;
}

export interface RoleClaim {
  id: number;
  roleId: string;
  claimType: string;
  claimValue: string;
}

export interface CreateRoleDto {
  name: string;
}

export interface UpdateRoleDto {
  name: string;
}

export interface CreateClaimDto {
  claimType: string;
  claimValue: string;
}

export interface AssignRoleToUserDto {
  userId: string;
  roleName: string;
}

export interface AssignClaimToUserDto {
  userId: string;
  claimType: string;
  claimValue: string;
}

export interface UserClaim {
  type: string;
  value: string;
}

export interface UserRoleAssignment {
  userId: string;
  userName: string;
  userEmail: string;
  roleId: string;
  roleName: string;
}

export interface UserRoleAssignmentsPage {
  items: UserRoleAssignment[];
  totalCount: number;
  pageSize: number;
}

export interface AuthorizationUser {
  id: string;
  name: string;
  email: string;
}

export interface GetUserRoleAssignmentsParams {
  page?: number;
  pageSize?: number;
  q?: string;
  roleName?: string;
}

export interface AvailableClaims {
  [claimType: string]: string[];
}
