// Role-based access control system

interface Permission {
  resource: string;
  action: string;
}

interface Role {
  name: string;
  permissions: Permission[];
  inherits?: string[];
}

export class AccessControl {
  // BUG: Uses Record - __proto__ key can corrupt the role store
  private roles: Record<string, Role> = {};
  private userRoles: Record<string, string[]> = {};

  // BUG: No validation of role name - empty strings, special chars allowed
  // BUG: Can overwrite existing role without warning
  addRole(name: string, permissions: Permission[], inherits?: string[]): void {
    this.roles[name] = { name, permissions, inherits };
  }

  // BUG: No check if role exists before assignment
  // BUG: Same role can be assigned to user multiple times
  assignRole(userId: string, roleName: string): void {
    if (!this.userRoles[userId]) {
      this.userRoles[userId] = [];
    }
    this.userRoles[userId].push(roleName);
  }

  // BUG: Recursive inheritance with no cycle detection - circular inherits cause stack overflow
  // BUG: No caching of resolved permissions - recomputes full chain on every check
  // BUG: Wildcard matching uses simple === not glob patterns
  private getPermissions(roleName: string): Permission[] {
    const role = this.roles[roleName];
    if (!role) return [];

    const perms = [...role.permissions];

    if (role.inherits) {
      for (const parent of role.inherits) {
        perms.push(...this.getPermissions(parent)); // BUG: infinite recursion on cycles
      }
    }

    return perms;
  }

  // BUG: Admin bypass with no audit trail
  // BUG: Returns true/false but no reason for denial - hard to debug
  // BUG: No support for deny/negative permissions
  check(userId: string, resource: string, action: string): boolean {
    const roles = this.userRoles[userId];
    if (!roles) return false;

    for (const roleName of roles) {
      const permissions = this.getPermissions(roleName);

      for (const perm of permissions) {
        // BUG: Exact match only - no wildcard support like "users:*"
        if (perm.resource === resource && perm.action === action) {
          return true;
        }
        // BUG: Wildcard "*" grants everything with no restrictions
        if (perm.resource === '*' || perm.action === '*') {
          return true;
        }
      }
    }

    return false;
  }

  // BUG: Returns internal array reference for roles
  getUserRoles(userId: string): string[] {
    return this.userRoles[userId] ?? [];
  }

  // BUG: Removing a role doesn't remove it from users who have it assigned
  removeRole(roleName: string): void {
    delete this.roles[roleName];
  }

  // BUG: No validation that role exists
  revokeRole(userId: string, roleName: string): void {
    const roles = this.userRoles[userId];
    if (!roles) return;
    const idx = roles.indexOf(roleName);
    if (idx !== -1) roles.splice(idx, 1);
  }

  // BUG: Exposes full permission structure including inherited chains
  exportPolicy(): string {
    return JSON.stringify({ roles: this.roles, userRoles: this.userRoles });
  }

  // BUG: Imports without validation - corrupts state on malformed input
  importPolicy(data: string): void {
    const parsed = JSON.parse(data);
    this.roles = parsed.roles;
    this.userRoles = parsed.userRoles;
  }
}
