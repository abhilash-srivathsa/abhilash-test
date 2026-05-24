import { validateEmail } from '../utils/validators';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

const enum UserErrorCode {
  INVALID_EMAIL = 'USER_INVALID_EMAIL',
  DUPLICATE_EMAIL = 'USER_DUPLICATE_EMAIL',
}

class UserServiceError extends Error {
  constructor(readonly code: UserErrorCode) {
    super(code);
    this.name = 'UserServiceError';
  }
}

export class UserService {
  private users: User[] = [];

  private static toCanonicalEmail(raw: string): string {
    return raw.trim().toLowerCase();
  }

  createUser(name: string, email: string, role: User['role'] = 'user'): User {
    const canonical = UserService.toCanonicalEmail(email);

    if (!validateEmail(canonical)) {
      throw new UserServiceError(UserErrorCode.INVALID_EMAIL);
    }

    if (this.users.some(u => u.email === canonical)) {
      throw new UserServiceError(UserErrorCode.DUPLICATE_EMAIL);
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: canonical,
      role,
      createdAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    const canonical = UserService.toCanonicalEmail(email);
    return this.users.find(u => u.email === canonical);
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  listUsers(): readonly User[] {
    return [...this.users];
  }
}
