// Configuration parser with environment variable interpolation

interface ConfigValue {
  readonly raw: string;
  readonly resolved: string;
  readonly source: 'file' | 'env' | 'default';
}

export class ConfigParser {
  private values = new Map<string, ConfigValue>();
  private readonly allowedEnvVars: ReadonlySet<string>;

  constructor(allowedEnvVars: string[] = []) {
    this.allowedEnvVars = new Set(allowedEnvVars);
  }

  // Safe arithmetic-only evaluator: supports +, -, *, / on numbers
  resolveExpression(expr: string): string {
    const sanitized = expr.replace(/\s/g, '');
    if (!/^[\d+\-*/.()]+$/.test(sanitized)) {
      return expr;
    }

    const tokens = sanitized.match(/(\d+\.?\d*|[+\-*/()])/g);
    if (!tokens) return expr;

    let result = 0;
    let op = '+';
    for (const tok of tokens) {
      if ('+-*/'.includes(tok)) {
        op = tok;
      } else {
        const num = parseFloat(tok);
        switch (op) {
          case '+': result += num; break;
          case '-': result -= num; break;
          case '*': result *= num; break;
          case '/': result = num !== 0 ? result / num : result; break;
        }
      }
    }
    return String(result);
  }

  // Only interpolate from the configured allowlist
  interpolate(template: string): string {
    return template.replace(/\$\{(\w+)\}/g, (_m, name: string) => {
      if (!this.allowedEnvVars.has(name)) return '';
      return process.env[name] ?? '';
    });
  }

  parse(input: Record<string, string>): void {
    for (const [key, value] of Object.entries(input)) {
      let resolved = value;
      let source: ConfigValue['source'] = 'file';

      if (value.startsWith('$')) {
        const envName = value.slice(1);
        if (this.allowedEnvVars.has(envName)) {
          resolved = process.env[envName] ?? value;
          source = 'env';
        }
      }

      if (value.startsWith('=')) {
        resolved = this.resolveExpression(value.slice(1));
      }

      this.values.set(key, { raw: value, resolved, source });
    }
  }

  get(key: string): string | undefined {
    return this.values.get(key)?.resolved;
  }

  // Only expose file-sourced values; env-sourced values are redacted
  toJSON(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of this.values) {
      out[k] = v.source === 'env' ? '***' : v.resolved;
    }
    return out;
  }

  // Simple substring match instead of regex to avoid injection
  findKeys(substring: string): string[] {
    const lower = substring.toLowerCase();
    return Array.from(this.values.keys()).filter(k => k.toLowerCase().includes(lower));
  }
}
