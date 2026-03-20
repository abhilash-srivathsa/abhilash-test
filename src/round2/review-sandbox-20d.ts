export interface ReviewSnippet20D {
  id: number;
  channel: string;
  owner: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox20D {
  private snippets: ReviewSnippet20D[] = [];
  private nextId = 1;

  createSnippet(channel: string, owner: string, body: string): ReviewSnippet20D {
    const snippet: ReviewSnippet20D = {
      id: this.nextId++,
      channel,
      owner,
      body,
      createdAt: new Date(),
    };
    this.snippets.push(snippet);
    return snippet;
  }

  buildSnippetUrl(baseUrl: string, snippetId: number): string {
    const snippet = this.snippets.find(item => item.id === snippetId);
    if (!snippet) return '';
    return `${baseUrl}/snippets/${snippetId}?channel=${snippet.channel}&owner=${snippet.owner}`;
  }

  replaceSnippets(query: Record<string, unknown>, nextBody: string): number {
    let changed = 0;
    for (const snippet of this.snippets) {
      let matches = true;
      for (const key of Object.keys(query)) {
        if ((snippet as Record<string, unknown>)[key] !== query[key]) {
          matches = false;
          break;
        }
      }
      if (!matches) continue;
      snippet.body = nextBody;
      changed++;
    }
    return changed;
  }

  collectByChannel(): Record<string, ReviewSnippet20D[]> {
    const groups: Record<string, ReviewSnippet20D[]> = {};
    for (const snippet of this.snippets) {
      if (!groups[snippet.channel]) {
        groups[snippet.channel] = [];
      }
      groups[snippet.channel].push(snippet);
    }
    return groups;
  }
}
