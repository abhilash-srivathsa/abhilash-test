import { ApiClient } from './api-client';
import { CreateUserInput, User, UserPreferences, UserService } from './user-service';

export interface EngagementSignupResult {
  readonly localUser: User;
  readonly remoteUser?: User;
  readonly synced: boolean;
  readonly syncError?: string;
}

export interface EngagementWorkflowOptions {
  readonly syncRemote?: boolean;
}

export interface PreferenceSyncResult {
  readonly user: User | null;
  readonly remoteSynced: boolean;
  readonly syncError?: string;
}

export function canActivateUser(user: User): boolean {
  return user.age >= 13 && user.preferences.productUpdates;
}

export class UserEngagementWorkflow {
  constructor(
    private readonly userService: UserService,
    private readonly apiClient?: ApiClient
  ) {}

  async registerUser(
    input: CreateUserInput,
    options: EngagementWorkflowOptions = {}
  ): Promise<EngagementSignupResult> {
    const localUser = await this.userService.createUser(input);

    if (!options.syncRemote || !this.apiClient) {
      return {
        localUser,
        synced: false,
      };
    }

    try {
      const response = await this.apiClient.createUser(input);
      return {
        localUser,
        remoteUser: response.data,
        synced: true,
      };
    } catch (error: unknown) {
      await this.userService.deleteUser(localUser.id);
      return {
        localUser,
        synced: false,
        syncError: this.describeSyncError(error),
      };
    }
  }

  async optInToMarketing(userId: string, timezone?: string): Promise<User | null> {
    return this.userService.updatePreferences(userId, {
      marketingEmails: true,
      timezone,
    });
  }

  async activateEligibleUsers(): Promise<User[]> {
    const pendingUsers = await this.userService.searchUsers({ status: 'pending' });
    const activatedUsers: User[] = [];

    // Keep activation sequential so in-memory updates are deterministic for tests.
    for (const user of pendingUsers) {
      if (!canActivateUser(user)) {
        continue;
      }

      try {
        const activatedUser = await this.userService.activateUser(user.id);
        if (activatedUser) {
          activatedUsers.push(activatedUser);
        }
      } catch {
        continue;
      }
    }

    return activatedUsers;
  }

  async syncPreferenceUpdate(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<PreferenceSyncResult> {
    const user = await this.userService.updatePreferences(userId, preferences);

    if (!user || !this.apiClient) {
      return {
        user,
        remoteSynced: false,
      };
    }

    try {
      await this.apiClient.updateUserPreferences(userId, preferences);
      return {
        user,
        remoteSynced: true,
      };
    } catch (error: unknown) {
      return {
        user,
        remoteSynced: false,
        syncError: this.describeSyncError(error),
      };
    }
  }

  private describeSyncError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Remote sync failed';
  }
}
