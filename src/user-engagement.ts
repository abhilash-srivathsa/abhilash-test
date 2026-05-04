import { ApiClient } from './api-client';
import { CreateUserInput, User, UserPreferences, UserService } from './user-service';

export interface EngagementSignupResult {
  localUser: User;
  remoteUser?: User;
  synced: boolean;
}

export interface EngagementWorkflowOptions {
  syncRemote?: boolean;
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

    const response = await this.apiClient.createUser(input);
    return {
      localUser,
      remoteUser: response.data,
      synced: true,
    };
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

    for (const user of pendingUsers) {
      if (this.canActivate(user)) {
        const activatedUser = await this.userService.activateUser(user.id);
        if (activatedUser) {
          activatedUsers.push(activatedUser);
        }
      }
    }

    return activatedUsers;
  }

  async syncPreferenceUpdate(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<User | null> {
    const user = await this.userService.updatePreferences(userId, preferences);

    if (user && this.apiClient) {
      await this.apiClient.updateUserPreferences(userId, preferences);
    }

    return user;
  }

  private canActivate(user: User): boolean {
    return user.age >= 13 && user.preferences.productUpdates;
  }
}
