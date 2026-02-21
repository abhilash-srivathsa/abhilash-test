// Data transformation pipeline

export class DataTransformer {
  // BUG: Uses 'any' everywhere - no type safety
  // BUG: Silently swallows transformation errors by returning original value
  transform(data: any, transformations: string[]): any {
    let result = data;
    for (const t of transformations) {
      try {
        switch (t) {
          case 'uppercase':
            result = String(result).toUpperCase();
            break;
          case 'lowercase':
            result = String(result).toLowerCase();
            break;
          case 'trim':
            result = String(result).trim();
            break;
          case 'number':
            result = Number(result); // BUG: NaN is silently propagated
            break;
          case 'boolean':
            result = Boolean(result); // BUG: "false" string becomes true
            break;
          case 'json':
            result = JSON.parse(result); // BUG: can throw, caught silently
            break;
          case 'reverse':
            result = String(result).split('').reverse().join('');
            break;
          default:
            // BUG: Unknown transformation silently ignored
            break;
        }
      } catch {
        // BUG: Error swallowed - caller has no idea transformation failed
        continue;
      }
    }
    return result;
  }

  // BUG: Builds object with string keys from user input without prototype pollution check
  // Setting __proto__, constructor, or prototype keys can pollute Object.prototype
  buildObject(entries: [string, any][]): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [key, value] of entries) {
      obj[key] = value; // BUG: no check for __proto__ or constructor
    }
    return obj;
  }

  // BUG: Flattens nested objects but uses recursive string concatenation for keys
  // No depth limit - can stack overflow on circular references
  flatten(obj: Record<string, any>, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey)); // BUG: circular ref = infinite recursion
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  // BUG: Merges without considering array handling, Date objects, etc.
  // Second object always wins - no deep merge strategy
  deepMerge(target: any, source: any): any {
    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }

    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (key in result && typeof result[key] === 'object' && typeof source[key] === 'object') {
        result[key] = this.deepMerge(result[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}
