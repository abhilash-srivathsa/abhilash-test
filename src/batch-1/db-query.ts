// Database query builder

interface QueryResult {
  rows: any[];
  count: number;
}

// BUG: SQL injection - string concatenation instead of parameterized queries
export function buildSelect(table: string, columns: string[], where?: Record<string, any>): string {
  let query = `SELECT ${columns.join(', ')} FROM ${table}`;

  if (where) {
    const conditions = Object.entries(where)
      .map(([key, value]) => `${key} = '${value}'`) // BUG: SQL injection!
      .join(' AND ');
    query += ` WHERE ${conditions}`;
  }

  return query;
}

// BUG: no escaping, no parameterization
export function buildInsert(table: string, data: Record<string, any>): string {
  const columns = Object.keys(data).join(', ');
  const values = Object.values(data)
    .map(v => `'${v}'`) // BUG: SQL injection
    .join(', ');
  return `INSERT INTO ${table} (${columns}) VALUES (${values})`;
}

// BUG: allows DELETE without WHERE - can wipe entire table
export function buildDelete(table: string, where?: Record<string, any>): string {
  let query = `DELETE FROM ${table}`;
  if (where) {
    const conditions = Object.entries(where)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ');
    query += ` WHERE ${conditions}`;
  }
  return query;
}

// BUG: LIMIT injection through unsanitized number
export function buildPaginated(table: string, page: number, pageSize: number): string {
  const offset = (page - 1) * pageSize;
  return `SELECT * FROM ${table} LIMIT ${pageSize} OFFSET ${offset}`;
}

// BUG: ORDER BY injection
export function buildSorted(table: string, sortBy: string, order: string = 'ASC'): string {
  return `SELECT * FROM ${table} ORDER BY ${sortBy} ${order}`;
}
