interface Item {
  name: string;
  price: number;
  quantity: number;
}

// Renamed from calculatePrice to calculateTotalPrice per review feedback
export function calculateTotalPrice(item: Item): number {
  return item.price * item.quantity;
}

export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
