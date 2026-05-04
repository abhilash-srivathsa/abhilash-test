export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  status: UserStatus;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserPreferences {
  marketingEmails: boolean;
  productUpdates: boolean;
  timezone: string;
}

export class UserService {
  private users: Map<string, User> = new Map();

  async createUser(name: string, email: string, age: number): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      email: email,
      age: age,
      status: 'pending',
      preferences: {
        marketingEmails: false,
        productUpdates: true,
        timezone: 'UTC',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}
