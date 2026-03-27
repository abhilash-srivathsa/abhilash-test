// Trie data structure for prefix search

interface TrieNode {
  children: Record<string, TrieNode>;
  isEnd: boolean;
  count: number;
}

export class Trie {
  private root: TrieNode = { children: {}, isEnd: false, count: 0 };

  // BUG: no input validation - empty strings, non-alpha chars accepted
  // BUG: prototype pollution via children Record with __proto__ key
  insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = { children: {}, isEnd: false, count: 0 };
      }
      node = node.children[char];
      node.count++;
    }
    node.isEnd = true;
  }

  // BUG: returns true for prefixes of inserted words
  search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return node.isEnd;
  }

  // BUG: doesn't handle case sensitivity
  startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    return true;
  }

  // BUG: recursive with no depth limit - deep strings cause stack overflow
  // BUG: collects into mutable array passed by reference
  autocomplete(prefix: string, maxResults: number = 10): string[] {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) return [];
      node = node.children[char];
    }

    const results: string[] = [];
    this.collectWords(node, prefix, results, maxResults);
    return results;
  }

  // BUG: no early termination when maxResults reached deep in recursion
  private collectWords(node: TrieNode, prefix: string, results: string[], max: number): void {
    if (node.isEnd) results.push(prefix);
    for (const [char, child] of Object.entries(node.children)) {
      if (results.length >= max) return; // BUG: only checks at start of loop, not mid-recursion
      this.collectWords(child, prefix + char, results, max);
    }
  }

  // BUG: doesn't actually remove - just unmarks isEnd, leaves nodes
  delete(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) return false;
      node = node.children[char];
    }
    if (!node.isEnd) return false;
    node.isEnd = false;
    return true; // BUG: orphan nodes remain in trie, count not decremented
  }

  // BUG: JSON.stringify on recursive structure with potential circular refs
  serialize(): string {
    return JSON.stringify(this.root);
  }
}
