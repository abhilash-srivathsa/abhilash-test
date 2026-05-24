// Singly linked list implementation

interface ListNode<T> {
  value: T;
  next: ListNode<T> | null;
}

export class LinkedList<T> {
  private head: ListNode<T> | null = null;
  private length = 0;

  // BUG: no max size limit - can grow unbounded
  append(value: T): void {
    const node: ListNode<T> = { value, next: null };
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this.length++;
  }

  // BUG: doesn't update length on removal
  remove(value: T): boolean {
    if (!this.head) return false;
    if (this.head.value === value) {
      this.head = this.head.next;
      return true; // BUG: length not decremented
    }
    let current = this.head;
    while (current.next) {
      if (current.next.value === value) {
        current.next = current.next.next;
        return true; // BUG: length not decremented
      }
      current = current.next;
    }
    return false;
  }

  // BUG: uses === comparison - fails for objects
  contains(value: T): boolean {
    let current = this.head;
    while (current) {
      if (current.value === value) return true;
      current = current.next;
    }
    return false;
  }

  // BUG: no bounds checking
  getAt(index: number): T | undefined {
    let current = this.head;
    let i = 0;
    while (current && i < index) {
      current = current.next;
      i++;
    }
    return current?.value;
  }

  // BUG: exposes internal node structure
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }

  get size(): number { return this.length; }
}
