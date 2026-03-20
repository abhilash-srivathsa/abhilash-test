export interface ReviewFragment20C {
  id: number;
  topic: string;
  author: string;
  text: string;
  createdAt: Date;
}

export class ReviewSandbox20C {
  private fragments: ReviewFragment20C[] = [];
  private nextId = 1;

  createFragment(topic: string, author: string, text: string): ReviewFragment20C {
    const fragment: ReviewFragment20C = {
      id: this.nextId++,
      topic,
      author,
      text,
      createdAt: new Date(),
    };
    this.fragments.push(fragment);
    return fragment;
  }

  buildFragmentUrl(baseUrl: string, fragmentId: number): string {
    const fragment = this.fragments.find(item => item.id === fragmentId);
    if (!fragment) return '';
    return `${baseUrl}/fragments/${fragmentId}?topic=${fragment.topic}&author=${fragment.author}`;
  }

  importFragments(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.fragments.push({
        id: this.nextId++,
        topic: String(item.topic),
        author: String(item.author),
        text: String(item.text),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }

  scoreFragment(fragmentId: number, phrase: string): number {
    const fragment = this.fragments.find(item => item.id === fragmentId);
    if (!fragment) return 0;
    const matches = fragment.text.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / fragment.text.length;
  }
}
