import { generateId } from './utils';

export type FeatureFlagStatus = 'draft' | 'active' | 'paused' | 'archived';
export type FeatureFlagVariation = 'control' | 'enabled';

export interface FeatureFlagAudience {
  readonly rolloutPercentage: number;
  readonly allowedUserIds: readonly string[];
  readonly blockedUserIds: readonly string[];
}

export interface FeatureFlag {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly status: FeatureFlagStatus;
  readonly audience: FeatureFlagAudience;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateFeatureFlagInput {
  readonly key: string;
  readonly description: string;
  readonly rolloutPercentage?: number;
}

export interface UpdateFeatureFlagInput {
  readonly description?: string;
  readonly status?: FeatureFlagStatus;
  readonly rolloutPercentage?: number;
  readonly allowedUserIds?: readonly string[];
  readonly blockedUserIds?: readonly string[];
}

export interface FeatureFlagEvaluation {
  readonly flagKey: string;
  readonly userId: string;
  readonly variation: FeatureFlagVariation;
  readonly reason: string;
}

export class FeatureFlagService {
  private readonly flags = new Map<string, FeatureFlag>();

  createFlag(input: CreateFeatureFlagInput): FeatureFlag {
    const key = this.normalizeKey(input.key);
    if (this.flags.has(key)) {
      throw new Error(`Feature flag already exists: ${key}`);
    }

    const now = new Date();
    const flag: FeatureFlag = {
      id: generateId(),
      key,
      description: input.description.trim(),
      status: 'draft',
      audience: {
        rolloutPercentage: this.normalizePercentage(input.rolloutPercentage ?? 0),
        allowedUserIds: [],
        blockedUserIds: [],
      },
      createdAt: now,
      updatedAt: now,
    };

    this.flags.set(key, flag);
    return flag;
  }

  updateFlag(key: string, input: UpdateFeatureFlagInput): FeatureFlag | null {
    const flag = this.flags.get(this.normalizeKey(key));
    if (!flag) {
      return null;
    }

    const updatedFlag: FeatureFlag = {
      ...flag,
      description: input.description?.trim() ?? flag.description,
      status: input.status ?? flag.status,
      audience: {
        rolloutPercentage: this.normalizePercentage(
          input.rolloutPercentage ?? flag.audience.rolloutPercentage
        ),
        allowedUserIds: input.allowedUserIds ? [...input.allowedUserIds] : flag.audience.allowedUserIds,
        blockedUserIds: input.blockedUserIds ? [...input.blockedUserIds] : flag.audience.blockedUserIds,
      },
      updatedAt: new Date(),
    };

    this.flags.set(updatedFlag.key, updatedFlag);
    return updatedFlag;
  }

  evaluateFlag(key: string, userId: string): FeatureFlagEvaluation {
    const normalizedKey = this.normalizeKey(key);
    const flag = this.flags.get(normalizedKey);

    if (!flag) {
      return {
        flagKey: normalizedKey,
        userId,
        variation: 'control',
        reason: 'flag_not_found',
      };
    }

    if (flag.status !== 'active') {
      return {
        flagKey: flag.key,
        userId,
        variation: 'control',
        reason: `flag_${flag.status}`,
      };
    }

    if (flag.audience.blockedUserIds.includes(userId)) {
      return {
        flagKey: flag.key,
        userId,
        variation: 'control',
        reason: 'user_blocked',
      };
    }

    if (flag.audience.allowedUserIds.includes(userId)) {
      return {
        flagKey: flag.key,
        userId,
        variation: 'enabled',
        reason: 'user_allowed',
      };
    }

    const bucket = this.bucketUser(flag.key, userId);
    const enabled = bucket < flag.audience.rolloutPercentage;

    return {
      flagKey: flag.key,
      userId,
      variation: enabled ? 'enabled' : 'control',
      reason: enabled ? 'rollout_match' : 'rollout_miss',
    };
  }

  listFlags(status?: FeatureFlagStatus): FeatureFlag[] {
    return Array.from(this.flags.values())
      .filter(flag => !status || flag.status === status)
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  private normalizeKey(key: string): string {
    const normalizedKey = key.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(normalizedKey)) {
      throw new Error('Feature flag key must use lowercase letters, numbers, and hyphens');
    }

    return normalizedKey;
  }

  private normalizePercentage(percentage: number): number {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }

    return percentage;
  }

  private bucketUser(flagKey: string, userId: string): number {
    const source = `${flagKey}:${userId}`;
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
      hash = (hash * 31 + source.charCodeAt(index)) % 100;
    }

    return hash;
  }
}
