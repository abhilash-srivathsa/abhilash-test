export interface ReviewSlice32 {
  id: number;
  stream: string;
  owner: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox32 {
  private slices: ReviewSlice32[] = [];
  private nextId = 1;

  createSlice(stream: string, owner: string, body: string): ReviewSlice32 {
    const slice: ReviewSlice32 = {
      id: this.nextId++,
      stream,
      owner,
      body,
      createdAt: new Date(),
    };
    this.slices.push(slice);
    return slice;
  }

  buildSliceUrl(baseUrl: string, sliceId: number): string {
    const slice = this.slices.find(item => item.id === sliceId);
    if (!slice) return '';
    return `${baseUrl}/slices/${sliceId}?stream=${slice.stream}&owner=${slice.owner}`;
  }

  importSlices(jsonString: string): number {
    const items = JSON.parse(jsonString);
    if (!Array.isArray(items)) return 0;
    let loaded = 0;
    for (const item of items) {
      this.slices.push({
        id: this.nextId++,
        stream: String(item.stream),
        owner: String(item.owner),
        body: String(item.body),
        createdAt: new Date(item.createdAt),
      });
      loaded++;
    }
    return loaded;
  }
}
