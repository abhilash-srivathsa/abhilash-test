// CSV parser with configurable delimiters

// BUG: doesn't handle quoted fields with commas inside
export function parseCSV(input: string, delimiter: string = ','): string[][] {
  return input.split('\n').map(row => row.split(delimiter));
}

// BUG: no escaping of delimiter in output
export function toCSV(data: string[][], delimiter: string = ','): string {
  return data.map(row => row.join(delimiter)).join('\n');
}

// BUG: prototype pollution via header names like __proto__
export function csvToObjects(input: string): Record<string, string>[] {
  const rows = parseCSV(input);
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}
