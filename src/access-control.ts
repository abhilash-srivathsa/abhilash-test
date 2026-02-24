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

// Simple glob-style matcher: supports trailing * only (e.g. "users.*" matches "users.list")
function globMatch(pattern: string, value: string): boolean {
  if (pattern === value) return true;
  if (pattern.endsWith('*')) {
    return value.startsWith(pattern.slice(0, -1));
  }
  return false;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(e => typeof e === 'string');
}

function isPermission(v: unknown): v is Permission {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as any).resource === 'string' &&
    typeof (v as any).action === 'string'
  );
}

export class AccessControl {
  private roles: { [k: string]: Role } = Object.create(null);
  private userRoles: { [k: string]: Set<string> } = Object.create(null);

  addRole(name: string, permissions: Permission[], inherits?: string[]): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Role name must be a non-empty string');
    }
    this.roles[name] = { name, permissions, inherits };
  }

  assignRole(userId: string, roleName: string): void {
    if (!(roleName in this.roles)) {
      throw new Error(`Role "${roleName}" does not exist`);
    }
    if (!(userId in this.userRoles)) {
      this.userRoles[userId] = new Set();
    }
    this.userRoles[userId].add(roleName); // Set prevents duplicates
  }

  // Iterative BFS — walks inheritance via a queue, never recurses
  private collectPermissions(roleName: string): Permission[] {
    const perms: Permission[] = [];
    const seen = new Set<string>();
    const queue: string[] = [roleName];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (seen.has(current)) continue; // cycle-safe
      seen.add(current);

      const role = this.roles[current];
      if (!role) continue;

      perms.push(...role.permissions);

      if (role.inherits) {
        for (const parent of role.inherits) {
          if (!seen.has(parent)) queue.push(parent);
        }
      }
    }

    return perms;
  }

  // Glob-aware permission matching — wildcards only apply to their own dimension
  check(userId: string, resource: string, action: string): boolean {
    const assigned = this.userRoles[userId];
    if (!assigned) return false;

    for (const roleName of assigned) {
      const permissions = this.collectPermissions(roleName);

      for (const perm of permissions) {
        if (globMatch(perm.resource, resource) && globMatch(perm.action, action)) {
          return true;
        }
      }
    }

    return false;
  }

  getUserRoles(userId: string): string[] {
    const s = this.userRoles[userId];
    return s ? Array.from(s) : [];
  }

  // Also clean up user assignments pointing to this role
  removeRole(roleName: string): void {
    delete this.roles[roleName];
    for (const uid in this.userRoles) {
      this.userRoles[uid].delete(roleName);
    }
  }

  revokeRole(userId: string, roleName: string): void {
    const s = this.userRoles[userId];
    if (s) s.delete(roleName);
  }

  exportPolicy(): string {
    const out: Record<string, unknown> = Object.create(null);
    out.roles = this.roles;
    const ur: Record<string, string[]> = Object.create(null);
    for (const uid in this.userRoles) {
      ur[uid] = Array.from(this.userRoles[uid]);
    }
    out.userRoles = ur;
    return JSON.stringify(out);
  }

  // Per-field validation before importing
  importPolicy(data: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new SyntaxError('Invalid JSON in importPolicy');
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new TypeError('Policy must be an object');
    }

    const obj = parsed as Record<string, unknown>;

    // Validate roles
    if (typeof obj.roles !== 'object' || obj.roles === null) {
      throw new TypeError('Policy.roles must be an object');
    }
    for (const [rn, rv] of Object.entries(obj.roles as Record<string, unknown>)) {
      const r = rv as Record<string, unknown>;
      if (typeof r.name !== 'string') throw new TypeError(`Invalid role name for key "${rn}"`);
      if (!Array.isArray(r.permissions) || !r.permissions.every(isPermission)) {
        throw new TypeError(`Invalid permissions for role "${rn}"`);
      }
      if (r.inherits !== undefined && !isStringArray(r.inherits)) {
        throw new TypeError(`Invalid inherits for role "${rn}"`);
      }
    }

    // Validate userRoles
    if (typeof obj.userRoles !== 'object' || obj.userRoles === null) {
      throw new TypeError('Policy.userRoles must be an object');
    }
    for (const [uid, roles] of Object.entries(obj.userRoles as Record<string, unknown>)) {
      if (!isStringArray(roles)) {
        throw new TypeError(`Invalid roles for user "${uid}"`);
      }
    }

    // All valid — apply
    this.roles = Object.create(null);
    for (const [k, v] of Object.entries(obj.roles as Record<string, Role>)) {
      this.roles[k] = v;
    }

    this.userRoles = Object.create(null);
    for (const [uid, arr] of Object.entries(obj.userRoles as Record<string, string[]>)) {
      this.userRoles[uid] = new Set(arr);
    }
  }
}
