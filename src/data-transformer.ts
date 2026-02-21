// Data transformation pipeline

type TransformFn = (input: unknown) => unknown;

const BUILTIN_TRANSFORMS: Record<string, TransformFn> = {
  uppercase: (v) => String(v).toUpperCase(),
  lowercase: (v) => String(v).toLowerCase(),
  trim: (v) => String(v).trim(),
  number: (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) throw new TypeError(`Cannot convert "${v}" to number`);
    return n;
  },
  boolean: (v) => v === 'true' || v === '1' || v === true,
  json: (v) => JSON.parse(String(v)),
  reverse: (v) => String(v).split('').reverse().join(''),
};

export class DataTransformer {
  private registry: Record<string, TransformFn>;

  constructor() {
    this.registry = Object.create(null) as Record<string, TransformFn>;
    for (const [name, fn] of Object.entries(BUILTIN_TRANSFORMS)) {
      this.registry[name] = fn;
    }
  }

  transform(data: unknown, transformations: string[]): unknown {
    let result = data;
    for (const t of transformations) {
      const fn = this.registry[t];
      if (!fn) {
        throw new Error(`Unknown transformation: "${t}"`);
      }
      result = fn(result);
    }
    return result;
  }

  // Use Object.create(null) so there's no prototype chain at all
  buildObject(entries: [string, unknown][]): Record<string, unknown> {
    const obj: Record<string, unknown> = Object.create(null);
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  }

  // Iterative flatten using an explicit stack with a hard depth ceiling
  flatten(obj: Record<string, unknown>, prefix: string = '', maxDepth: number = 20): Record<string, unknown> {
    const result: Record<string, unknown> = Object.create(null);
    const stack: Array<{ current: Record<string, unknown>; prefix: string; depth: number }> = [
      { current: obj, prefix, depth: 0 },
    ];

    while (stack.length > 0) {
      const frame = stack.pop()!;
      for (const [key, value] of Object.entries(frame.current)) {
        const fullKey = frame.prefix ? `${frame.prefix}.${key}` : key;
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          frame.depth < maxDepth
        ) {
          stack.push({ current: value as Record<string, unknown>, prefix: fullKey, depth: frame.depth + 1 });
        } else {
          result[fullKey] = value;
        }
      }
    }
    return result;
  }

  deepMerge(target: unknown, source: unknown): unknown {
    if (
      target === null || source === null ||
      typeof target !== 'object' || typeof source !== 'object' ||
      Array.isArray(target) || Array.isArray(source)
    ) {
      return source;
    }

    const merged: Record<string, unknown> = Object.create(null);
    const tObj = target as Record<string, unknown>;
    const sObj = source as Record<string, unknown>;

    for (const key of Object.keys(tObj)) {
      merged[key] = tObj[key];
    }
    for (const key of Object.keys(sObj)) {
      if (key in merged && typeof merged[key] === 'object' && typeof sObj[key] === 'object') {
        merged[key] = this.deepMerge(merged[key], sObj[key]);
      } else {
        merged[key] = sObj[key];
      }
    }
    return merged;
  }
}
