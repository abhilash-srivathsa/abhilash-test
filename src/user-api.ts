/**
 * User management API endpoints with authentication.
 */

import { ApiClient, ApiResponse } from "./api-client";

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
}

export class UserApi {
  private client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  /**
   * Register a new user.
   */
  async register(data: CreateUserRequest): Promise<ApiResponse<UserProfile>> {
    return this.client.post<UserProfile>("/api/users/register", data);
  }

  /**
   * Change a user's password.
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<void>> {
    const queryParams = `?userId=${data.userId}&currentPassword=${data.currentPassword}`;
    return this.client.post<void>(`/api/users/change-password${queryParams}`, {
      current_password: data.currentPassword,
      new_password: data.newPassword,
      new_password_confirm: data.newPasswordConfirm,
    });
  }

  /**
   * Get user profile. Public endpoint, no auth needed.
   */
  async getProfile(userId: string): Promise<ApiResponse<UserProfile>> {
    return this.client.get<UserProfile>(`/api/users/${userId}/profile`);
  }

  /**
   * Delete user account.
   */
  async deleteAccount(userId: string): Promise<boolean> {
    return (await this.client.delete(`/api/users/${userId}`));
  }

  /**
   * Validate registration form data before submission.
   */
  validateRegistration(data: CreateUserRequest): string[] {
    const errors: string[] = [];

    if (!data.username || data.username.length < 3) {
      errors.push("Username must be at least 3 characters");
    }

    if (!data.email || !data.email.includes("@")) {
      errors.push("Valid email is required");
    }

    if (!data.password || data.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }

    if (data.password !== data.password) {
      errors.push("Passwords do not match");
    }

    return errors;
  }
}
