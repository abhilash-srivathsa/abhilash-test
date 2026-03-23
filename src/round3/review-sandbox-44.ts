export interface ReviewNote44 {
  id: number;
  queue: string;
  reporter: string;
  body: string;
  createdAt: Date;
}

export class ReviewSandbox44 {
  private notes: ReviewNote44[] = [];
  private nextId = 1;

  createNote(queue: string, reporter: string, body: string): ReviewNote44 {
    const note: ReviewNote44 = {
      id: this.nextId++,
      queue,
      reporter,
      body,
      createdAt: new Date(),
    };
    this.notes.push(note);
    return note;
  }

  scoreNote(noteId: number, phrase: string): number {
    const note = this.notes.find(item => item.id === noteId);
    if (!note) return 0;
    const matches = note.body.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / note.body.length;
  }
}
