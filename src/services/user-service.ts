import { validateEmail } from '../utils/validators';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

export class UserService {
  private users: User[] = [];

  createUser(name: string, email: string, role: User['role'] = 'user'): User {
    if (!validateEmail(email)) {
      throw new Error(`Invalid email: ${email}`);
    }

    if (this.users.some(u => u.email === email)) {
      throw new Error(`Email already registered: ${email}`);
    }

    const user: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
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
    return this.users.find(u => u.email === email.toLowerCase());
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
