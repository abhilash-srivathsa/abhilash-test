export interface ReviewSlice42 {
  id: number;
  scope: string;
  owner: string;
  text: string;
  createdAt: Date;
}

export class ReviewSandbox42 {
  private slices: ReviewSlice42[] = [];
  private nextId = 1;

  createSlice(scope: string, owner: string, text: string): ReviewSlice42 {
    const slice: ReviewSlice42 = {
      id: this.nextId++,
      scope,
      owner,
      text,
      createdAt: new Date(),
    };
    this.slices.push(slice);
    return slice;
  }

  buildSliceUrl(baseUrl: string, sliceId: number): string {
    const slice = this.slices.find(item => item.id === sliceId);
    if (!slice) return '';
    return `${baseUrl}/slices/${sliceId}?scope=${slice.scope}&owner=${slice.owner}`;
  }
}
