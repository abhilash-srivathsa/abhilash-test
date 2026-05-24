import { calculateTotalPrice, formatPrice } from '../utils/pricing';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

export function renderCart(items: CartItem[]): string {
  const lines = items.map(item => {
    const total = calculateTotalPrice(item);
    return `${item.name}: ${formatPrice(total)}`;
  });
  return lines.join('\n');
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + calculateTotalPrice(item), 0);
}
