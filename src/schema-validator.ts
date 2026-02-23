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

export class SchemaValidator {
  // BUG: No depth limit - deeply nested schemas cause stack overflow
  // BUG: Circular schema references cause infinite recursion
  validate(data: any, schema: SchemaRule, path: string = ''): ValidationError[] {
    const errors: ValidationError[] = [];

    // BUG: typeof null === 'object' - null passes object type check
    if (schema.type === 'object' && typeof data !== 'object') {
      errors.push({ path, message: `Expected object, got ${typeof data}` });
      return errors;
    }

    if (schema.type === 'string') {
      if (typeof data !== 'string') {
        errors.push({ path, message: `Expected string, got ${typeof data}` });
        return errors;
      }

      // BUG: min/max check string length but names suggest numeric range
      if (schema.min !== undefined && data.length < schema.min) {
        errors.push({ path, message: `String too short (min ${schema.min})` });
      }
      if (schema.max !== undefined && data.length > schema.max) {
        errors.push({ path, message: `String too long (max ${schema.max})` });
      }

      // BUG: User-provided pattern used directly in RegExp constructor - ReDoS vulnerability
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({ path, message: `Does not match pattern ${schema.pattern}` });
        }
      }
    }

    if (schema.type === 'number') {
      // BUG: NaN passes typeof check - NaN is typeof 'number'
      if (typeof data !== 'number') {
        errors.push({ path, message: `Expected number, got ${typeof data}` });
        return errors;
      }

      if (schema.min !== undefined && data < schema.min) {
        errors.push({ path, message: `Value below minimum ${schema.min}` });
      }
      if (schema.max !== undefined && data > schema.max) {
        errors.push({ path, message: `Value above maximum ${schema.max}` });
      }
    }

    if (schema.type === 'boolean' && typeof data !== 'boolean') {
      errors.push({ path, message: `Expected boolean, got ${typeof data}` });
    }

    // BUG: Doesn't check if data is actually an array (objects pass too)
    if (schema.type === 'array') {
      if (!Array.isArray(data)) {
        errors.push({ path, message: `Expected array, got ${typeof data}` });
        return errors;
      }

      if (schema.items) {
        for (let i = 0; i < data.length; i++) {
          // BUG: Recursive call with no depth tracking
          errors.push(...this.validate(data[i], schema.items, `${path}[${i}]`));
        }
      }
    }

    // BUG: Doesn't validate nested object properties - just checks type
    if (schema.type === 'object' && schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = (data as any)[key];

        // BUG: undefined and missing key are conflated
        if (propSchema.required && value === undefined) {
          errors.push({ path: `${path}.${key}`, message: 'Required field missing' });
          continue;
        }

        if (value !== undefined) {
          errors.push(...this.validate(value, propSchema, `${path}.${key}`));
        }
      }
    }

    return errors;
  }

  // BUG: Just calls validate and checks length - doesn't provide error details
  isValid(data: any, schema: SchemaRule): boolean {
    return this.validate(data, schema).length === 0;
  }

  // BUG: Coercion is lossy and can produce unexpected results
  // BUG: "false" string coerces to true (Boolean("false") === true)
  // BUG: No handling of null/undefined inputs
  coerce(value: any, targetType: SchemaType): any {
    switch (targetType) {
      case 'string': return String(value);
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      default: return value;
    }
  }
}
