import { isValidEmail, normalizeTimezone } from './utils';

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

export interface CreateUserInput {
  name: string;
  email: string;
  age: number;
  preferences?: Partial<UserPreferences>;
}

export interface UserSearchOptions {
  status?: UserStatus;
  marketingEmails?: boolean;
}

export class UserService {
  private users: Map<string, User> = new Map();

  async createUser(name: string, email: string, age: number): Promise<User>;
  async createUser(input: CreateUserInput): Promise<User>;
  async createUser(
    inputOrName: CreateUserInput | string,
    email?: string,
    age?: number
  ): Promise<User> {
    const input = this.normalizeCreateInput(inputOrName, email, age);
    if (!isValidEmail(input.email)) {
      throw new Error('A valid email address is required');
    }

    const now = new Date();
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: input.name,
      email: input.email,
      age: input.age,
      status: 'pending',
      preferences: {
        ...this.defaultPreferences(),
        ...input.preferences,
        timezone: normalizeTimezone(input.preferences?.timezone),
      },
      createdAt: now,
      updatedAt: now,
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

  async activateUser(id: string): Promise<User | null> {
    return this.updateUserStatus(id, 'active');
  }

  async deactivateUser(id: string): Promise<User | null> {
    return this.updateUserStatus(id, 'inactive');
  }

  async updatePreferences(
    id: string,
    preferences: Partial<UserPreferences>
  ): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      preferences: {
        ...user.preferences,
        ...preferences,
        timezone: normalizeTimezone(preferences.timezone ?? user.preferences.timezone),
      },
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async searchUsers(options: UserSearchOptions = {}): Promise<User[]> {
    const users = await this.getAllUsers();

    return users.filter(user => {
      if (options.status && user.status !== options.status) {
        return false;
      }

      if (
        options.marketingEmails !== undefined &&
        user.preferences.marketingEmails !== options.marketingEmails
      ) {
        return false;
      }

      return true;
    });
  }

  private async updateUserStatus(id: string, status: UserStatus): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) {
      return null;
    }

    const updatedUser: User = {
      ...user,
      status,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  private normalizeCreateInput(
    inputOrName: CreateUserInput | string,
    email?: string,
    age?: number
  ): CreateUserInput {
    if (typeof inputOrName === 'string') {
      if (!email || age === undefined) {
        throw new Error('Email and age are required when creating a user by arguments');
      }

      return {
        name: inputOrName,
        email,
        age,
      };
    }

    return inputOrName;
  }

  private defaultPreferences(): UserPreferences {
    return {
      marketingEmails: false,
      productUpdates: true,
      timezone: 'UTC',
    };
  }
}
