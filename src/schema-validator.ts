// Schema validator for runtime type checking

type SchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array';

interface SchemaRule {
  type: SchemaType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  properties?: Record<string, SchemaRule>;
  items?: SchemaRule;
}

interface ValidationError {
  path: string;
  message: string;
}

// Reject patterns that contain dangerous quantifier nesting
function patternComplexity(pat: string): number {
  let nesting = 0;
  let maxNesting = 0;
  for (const ch of pat) {
    if (ch === '(' || ch === '[') nesting++;
    else if (ch === ')' || ch === ']') nesting--;
    if ((ch === '+' || ch === '*' || ch === '?') && nesting > 0) {
      maxNesting = Math.max(maxNesting, nesting);
    }
  }
  return maxNesting;
}

// Truthy/falsy lookup for boolean coercion
const BOOL_TABLE: ReadonlyMap<string, boolean> = new Map([
  ['true', true], ['yes', true], ['on', true], ['1', true],
  ['false', false], ['no', false], ['off', false], ['0', false],
]);

export class SchemaValidator {
  // Iterative, stack-based validation — no recursion at all
  validate(data: unknown, schema: SchemaRule, rootPath: string = ''): ValidationError[] {
    const errors: ValidationError[] = [];

    const stack: Array<{ data: unknown; schema: SchemaRule; path: string }> = [
      { data, schema, path: rootPath },
    ];

    while (stack.length > 0) {
      const frame = stack.pop()!;
      const { data: val, schema: rule, path } = frame;

      // Null guard — typeof null is 'object'
      if (val === null || val === undefined) {
        if (rule.required) {
          errors.push({ path, message: 'Required field missing' });
        }
        continue;
      }

      if (rule.type === 'string') {
        if (typeof val !== 'string') {
          errors.push({ path, message: `Expected string, got ${typeof val}` });
          continue;
        }
        if (rule.min !== undefined && val.length < rule.min) {
          errors.push({ path, message: `String too short (min ${rule.min})` });
        }
        if (rule.max !== undefined && val.length > rule.max) {
          errors.push({ path, message: `String too long (max ${rule.max})` });
        }
        if (rule.pattern) {
          // Reject overly complex patterns (nested quantifiers score > 1)
          if (patternComplexity(rule.pattern) > 1) {
            errors.push({ path, message: 'Pattern rejected: nested quantifiers detected' });
          } else {
            try {
              if (!new RegExp(rule.pattern).test(val)) {
                errors.push({ path, message: `Does not match pattern ${rule.pattern}` });
              }
            } catch {
              errors.push({ path, message: `Invalid regex pattern: ${rule.pattern}` });
            }
          }
        }
      }

      if (rule.type === 'number') {
        if (typeof val !== 'number' || Number.isNaN(val)) {
          errors.push({ path, message: `Expected number, got ${typeof val}` });
          continue;
        }
        if (rule.min !== undefined && val < rule.min) {
          errors.push({ path, message: `Value below minimum ${rule.min}` });
        }
        if (rule.max !== undefined && val > rule.max) {
          errors.push({ path, message: `Value above maximum ${rule.max}` });
        }
      }

      if (rule.type === 'boolean' && typeof val !== 'boolean') {
        errors.push({ path, message: `Expected boolean, got ${typeof val}` });
      }

      if (rule.type === 'array') {
        if (!Array.isArray(val)) {
          errors.push({ path, message: `Expected array, got ${typeof val}` });
          continue;
        }
        if (rule.items) {
          for (let i = 0; i < val.length; i++) {
            stack.push({ data: val[i], schema: rule.items, path: `${path}[${i}]` });
          }
        }
      }

      if (rule.type === 'object') {
        if (typeof val !== 'object' || Array.isArray(val)) {
          errors.push({ path, message: `Expected object, got ${typeof val}` });
          continue;
        }
        if (rule.properties) {
          for (const [key, propSchema] of Object.entries(rule.properties)) {
            const child = (val as Record<string, unknown>)[key];
            if (child === undefined && propSchema.required) {
              errors.push({ path: `${path}.${key}`, message: 'Required field missing' });
              continue;
            }
            if (child !== undefined) {
              stack.push({ data: child, schema: propSchema, path: `${path}.${key}` });
            }
          }
        }
      }
    }

    return errors;
  }

  isValid(data: unknown, schema: SchemaRule): boolean {
    return this.validate(data, schema).length === 0;
  }

  coerce(value: unknown, targetType: SchemaType): unknown {
    if (value === null || value === undefined) return value;

    switch (targetType) {
      case 'string':
        return String(value);
      case 'number': {
        const n = Number(value);
        return Number.isFinite(n) ? n : value;
      }
      case 'boolean': {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        const lookup = BOOL_TABLE.get(String(value).toLowerCase());
        return lookup !== undefined ? lookup : value;
      }
      default:
        return value;
    }
  }
}
