export interface ReviewNote34 {
  id: number;
  scope: string;
  reporter: string;
  text: string;
  createdAt: Date;
}

export class ReviewSandbox34 {
  private notes: ReviewNote34[] = [];
  private nextId = 1;

  createNote(scope: string, reporter: string, text: string): ReviewNote34 {
    const note: ReviewNote34 = {
      id: this.nextId++,
      scope,
      reporter,
      text,
      createdAt: new Date(),
    };
    this.notes.push(note);
    return note;
  }

  noteScore(noteId: number, phrase: string): number {
    const note = this.notes.find(item => item.id === noteId);
    if (!note) return 0;
    const matches = note.text.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / note.text.length;
  }
}
