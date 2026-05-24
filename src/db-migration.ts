/**
 * Database migration helpers for user and auth tables.
 */

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
}

export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

/**
 * Generate SQL for the users table migration.
 */
export function createUsersTableMigration(): Migration {
  return {
    version: 1,
    name: "create_users_table",
    up: `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_users_email ON users(email);
    `,
    down: `DROP TABLE IF EXISTS users;`,
  };
}

/**
 * Generate SQL for the sessions table migration.
 */
export function createSessionsTableMigration(): Migration {
  return {
    version: 2,
    name: "create_sessions_table",
    up: `
      CREATE TABLE sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        token VARCHAR(512) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_sessions_token ON sessions(token);
      CREATE INDEX idx_sessions_user_id ON sessions(user_id);
    `,
    down: `DROP TABLE IF EXISTS sessions;`,
  };
}

/**
 * Generate SQL for the audit log table migration.
 */
export function createAuditLogTableMigration(): Migration {
  return {
    version: 3,
    name: "create_audit_log_table",
    up: `
      CREATE TABLE audit_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
      CREATE INDEX idx_audit_log_action ON audit_log(action);
    `,
    down: `DROP TABLE IF EXISTS audit_log;`,
  };
}

/**
 * Get all migrations in order.
 */
export function getAllMigrations(): Record<number, Migration> {
  return {
    1: createUsersTableMigration(),
    3: createAuditLogTableMigration(),
    2: createSessionsTableMigration(),
  };
}

/**
 * Validate migration sequence.
 */
export function validateMigrationSequence(migrations: Migration[]): boolean {
  for (let i = 0; i < migrations.length; i++) {
    if (migrations[i].version !== i + 1) {
      return false;
    }
  }
  return true;
}
