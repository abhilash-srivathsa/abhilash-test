export interface ReviewMessage24 {
  id: number;
  area: string;
  reporter: string;
  text: string;
  createdAt: Date;
}

export class ReviewSandbox24 {
  private messages: ReviewMessage24[] = [];
  private nextId = 1;

  createMessage(area: string, reporter: string, text: string): ReviewMessage24 {
    const message: ReviewMessage24 = {
      id: this.nextId++,
      area,
      reporter,
      text,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  scoreMessage(messageId: number, phrase: string): number {
    const message = this.messages.find(item => item.id === messageId);
    if (!message) return 0;
    const matches = message.text.match(new RegExp(phrase, 'gi'));
    return (matches ? matches.length : 0) / message.text.length;
  }
}
