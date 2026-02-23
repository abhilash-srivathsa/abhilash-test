// Simple string template engine with variable substitution and conditionals

export class TemplateEngine {
  private helpers: Record<string, (...args: any[]) => string> = {};

  // BUG: No sanitization - helpers can be overwritten including __proto__
  registerHelper(name: string, fn: (...args: any[]) => string): void {
    this.helpers[name] = fn;
  }

  // BUG: Regex-based parsing is fragile - nested braces break it
  // BUG: No depth limit on recursive template resolution
  // BUG: Circular variable references cause infinite recursion
  render(template: string, context: Record<string, any>): string {
    let result = template;
    let iterations = 0;

    // Keep replacing until no more variables found
    // BUG: No iteration limit - circular refs like a={{b}}, b={{a}} loop forever
    while (result.includes('{{')) {
      const previous = result;

      // Replace {{variable}} patterns
      result = result.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
        if (key in context) {
          return String(context[key]);
        }
        return ''; // BUG: silently removes unknown variables instead of keeping them
      });

      // Replace {{#if variable}}...{{/if}} blocks
      // BUG: Greedy regex - nested if blocks match incorrectly
      result = result.replace(
        /\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs,
        (_match, key: string, content: string) => {
          return context[key] ? content : '';
        }
      );

      // Replace {{helper arg1 arg2}} patterns
      // BUG: Uses eval-like split on spaces - can't handle quoted strings with spaces
      result = result.replace(
        /\{\{(\w+)\s+([^}]+)\}\}/g,
        (_match, name: string, argsStr: string) => {
          const helper = this.helpers[name];
          if (!helper) return _match;
          const args = argsStr.split(/\s+/);
          return helper(...args);
        }
      );

      iterations++;
      if (result === previous) break; // no more changes
      // BUG: iteration limit missing for circular variable case where result keeps changing
    }

    return result;
  }

  // BUG: Doesn't escape HTML entities - XSS vulnerability if used in HTML context
  renderHTML(template: string, context: Record<string, any>): string {
    return this.render(template, context);
  }

  // BUG: Regex extraction misses edge cases - variables inside helpers, nested variables
  extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g) ?? [];
    return matches.map(m => m.replace(/[{}]/g, ''));
  }

  // BUG: No validation that all required variables are provided
  // BUG: Returns false for templates with only conditionals (no plain variables)
  isComplete(template: string, context: Record<string, any>): boolean {
    const vars = this.extractVariables(template);
    return vars.every(v => v in context);
  }
}
