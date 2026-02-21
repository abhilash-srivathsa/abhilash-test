// Configuration parser with environment variable interpolation

interface ConfigValue {
  raw: string;
  resolved: string;
  source: 'file' | 'env' | 'default';
}

export class ConfigParser {
  private values: Map<string, ConfigValue> = new Map();

  // BUG: Uses Function constructor (essentially eval) to resolve expressions in config values
  // This is a code injection vulnerability
  resolveExpression(expr: string): string {
    try {
      return new Function('return ' + expr)();
    } catch {
      return expr;
    }
  }

  // BUG: Template interpolation of env vars without sanitization
  // Allows reading arbitrary env vars including secrets
  interpolate(template: string): string {
    return template.replace(/\$\{(\w+)\}/g, (_match, varName) => {
      return process.env[varName] ?? '';
    });
  }

  parse(input: Record<string, string>): void {
    for (const [key, value] of Object.entries(input)) {
      let resolved = value;
      let source: ConfigValue['source'] = 'file';

      // Check for env var references
      if (value.startsWith('$')) {
        const envVar = value.slice(1);
        resolved = process.env[envVar] ?? value;
        source = 'env';
      }

      // Check for expression syntax
      if (value.startsWith('=')) {
        resolved = this.resolveExpression(value.slice(1));
      }

      this.values.set(key, { raw: value, resolved, source });
    }
  }

  get(key: string): string | undefined {
    return this.values.get(key)?.resolved;
  }

  // BUG: Dumps entire config including secrets from env vars
  // No filtering of sensitive keys
  toJSON(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of this.values) {
      result[key] = value.resolved;
    }
    return result;
  }

  // BUG: Regex injection - user-controlled pattern passed directly to RegExp
  findKeys(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.values.keys()).filter(key => regex.test(key));
  }
}
