// Simple string template engine with variable substitution and conditionals

// Entity lookup table for HTML encoding — avoids chained .replace() calls
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const ENTITY_RE = /[&<>"']/g;

function encodeEntities(str: string): string {
  return str.replace(ENTITY_RE, (ch) => HTML_ENTITIES[ch]);
}

type HelperFn = (...args: string[]) => string;

export class TemplateEngine {
  // Prototype-free store — no __proto__ or constructor collisions
  private helpers: { [name: string]: HelperFn } = Object.create(null);

  registerHelper(name: string, fn: HelperFn): void {
    this.helpers[name] = fn;
  }

  // Single-pass renderer — resolves every token in one scan, no while-loop
  render(template: string, context: Record<string, unknown>): string {
    // 1) Strip conditionals first (single regex, non-greedy)
    let result = template.replace(
      /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_m, key: string, body: string) => (context[key] ? body : ''),
    );

    // 2) Resolve helpers and plain variables in one pass
    result = result.replace(
      /\{\{(\w+)(?:\s+([^}]+))?\}\}/g,
      (_m, name: string, argsStr?: string) => {
        // If it looks like a helper call (has args or registered helper)
        if (argsStr && name in this.helpers) {
          return this.helpers[name](...argsStr.split(/\s+/));
        }
        // Plain variable
        return name in context ? String(context[name]) : '';
      },
    );

    return result;
  }

  // HTML-safe rendering — encode every interpolated value through entity table
  renderHTML(template: string, context: Record<string, unknown>): string {
    const safeCtx: Record<string, unknown> = Object.create(null);
    for (const [k, v] of Object.entries(context)) {
      safeCtx[k] = typeof v === 'string' ? encodeEntities(v) : v;
    }
    return this.render(template, safeCtx);
  }

  extractVariables(template: string): string[] {
    const seen = new Set<string>();
    const re = /\{\{(\w+)\}\}/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(template)) !== null) {
      seen.add(m[1]);
    }
    return Array.from(seen);
  }

  isComplete(template: string, context: Record<string, unknown>): boolean {
    const vars = this.extractVariables(template);
    return vars.every(v => v in context);
  }
}
