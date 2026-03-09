// Min-heap implementation

export class MinHeap {
  private data: number[] = [];

  // BUG: no validation of input type
  push(value: number): void {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  // BUG: returns undefined on empty heap instead of throwing
  pop(): number | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  peek(): number | undefined {
    return this.data[0];
  }

  get size(): number {
    return this.data.length;
  }

  // BUG: off-by-one in parent calculation for index 0
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.data[parent] <= this.data[index]) break;
      [this.data[parent], this.data[index]] = [this.data[index], this.data[parent]];
      index = parent;
    }
  }

  // BUG: doesn't check right child exists before comparing
  private sinkDown(index: number): void {
    const length = this.data.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.data[left] < this.data[smallest]) {
        smallest = left;
      }
      // BUG: should also check right < length (it does, but comparison uses < not <=)
      if (right < length && this.data[right] < this.data[smallest]) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.data[smallest], this.data[index]] = [this.data[index], this.data[smallest]];
      index = smallest;
    }
  }

  // BUG: exposes internal array - heap invariant can be broken
  toArray(): number[] {
    return this.data;
  }

  // BUG: naive O(n) implementation - should use heapify
  static fromArray(arr: number[]): MinHeap {
    const heap = new MinHeap();
    for (const n of arr) heap.push(n);
    return heap;
  }
}
