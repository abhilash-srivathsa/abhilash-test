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

// Encode a permission as a canonical string key
function permKey(resource: string, action: string): string {
  return `${resource}\0${action}`;
}

export class AccessControl {
  private roleDefs = new Map<string, Role>();

  // Pre-computed flat permission sets per role — rebuilt on any role mutation
  // Inheritance is resolved eagerly so check() never traverses anything
  private resolved = new Map<string, Set<string>>();
  private userRoles = new Map<string, Set<string>>();

  private rebuildResolved(): void {
    this.resolved.clear();

    // Topological flatten: for each role, collect own + all ancestor permissions
    // into a single Set<string>. Because we iterate the full roleDefs map each
    // time and cap the walk at roleDefs.size steps, cycles are impossible to
    // cause a hang — the loop simply terminates.
    for (const [name, role] of this.roleDefs) {
      const keys = new Set<string>();
      const pending = [role];
      let steps = 0;

      while (pending.length > 0 && steps < this.roleDefs.size + 1) {
        steps++;
        const cur = pending.pop()!;
        for (const p of cur.permissions) keys.add(permKey(p.resource, p.action));
        for (const parentName of cur.inherits ?? []) {
          const parent = this.roleDefs.get(parentName);
          if (parent) pending.push(parent);
        }
      }

      this.resolved.set(name, keys);
    }
  }

  addRole(name: string, permissions: Permission[], inherits?: string[]): void {
    this.roleDefs.set(name, { name, permissions, inherits });
    this.rebuildResolved();
  }

  assignRole(userId: string, roleName: string): void {
    if (!this.roleDefs.has(roleName)) {
      throw new Error(`Unknown role: ${roleName}`);
    }
    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Set());
    }
    this.userRoles.get(userId)!.add(roleName);
  }

  // Single Set.has() lookup per role — no traversal, no recursion, no graph walk
  check(userId: string, resource: string, action: string): boolean {
    const roles = this.userRoles.get(userId);
    if (!roles) return false;

    const needle = permKey(resource, action);

    for (const rn of roles) {
      const perms = this.resolved.get(rn);
      if (!perms) continue;

      // Exact match
      if (perms.has(needle)) return true;

      // Wildcard: resource=* means all resources for that action, and vice-versa
      // Both dimensions must match independently
      if (perms.has(permKey('*', action))) return true;
      if (perms.has(permKey(resource, '*'))) return true;
      if (perms.has(permKey('*', '*'))) return true;
    }

    return false;
  }

  getUserRoles(userId: string): string[] {
    return Array.from(this.userRoles.get(userId) ?? []);
  }

  removeRole(roleName: string): void {
    this.roleDefs.delete(roleName);
    // Cascade: strip from every user
    for (const roles of this.userRoles.values()) {
      roles.delete(roleName);
    }
    this.rebuildResolved();
  }

  revokeRole(userId: string, roleName: string): void {
    this.userRoles.get(userId)?.delete(roleName);
  }

  exportPolicy(): string {
    const roles: Record<string, Role> = {};
    for (const [k, v] of this.roleDefs) roles[k] = v;
    const ur: Record<string, string[]> = {};
    for (const [k, v] of this.userRoles) ur[k] = Array.from(v);
    return JSON.stringify({ roles, userRoles: ur });
  }

  importPolicy(data: string): void {
    const obj = JSON.parse(data);

    // Build into temporaries — only swap on full success
    const tmpRoles = new Map<string, Role>();
    const tmpUR = new Map<string, Set<string>>();

    for (const [k, v] of Object.entries(obj.roles ?? {})) {
      const r = v as Role;
      if (typeof r.name !== 'string' || !Array.isArray(r.permissions)) {
        throw new TypeError(`Malformed role: ${k}`);
      }
      tmpRoles.set(k, r);
    }

    for (const [uid, arr] of Object.entries(obj.userRoles ?? {})) {
      if (!Array.isArray(arr)) throw new TypeError(`Malformed userRoles for ${uid}`);
      tmpUR.set(uid, new Set(arr as string[]));
    }

    // Atomic swap
    this.roleDefs = tmpRoles;
    this.userRoles = tmpUR;
    this.rebuildResolved();
  }
}
