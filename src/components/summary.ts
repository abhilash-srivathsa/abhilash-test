// BUG: Still using old function name - NOT updated after rename
import { calculatePrice } from '../utils/pricing';

interface SummaryItem {
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export function getOrderSummary(items: SummaryItem[]): string {
  const subtotal = items.reduce((sum, item) => sum + calculatePrice(item), 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  return [
    'Order Summary',
    '-------------',
    ...items.map(item => `${item.name} x${item.quantity}: $${calculatePrice(item).toFixed(2)}`),
    '-------------',
    `Subtotal: $${subtotal.toFixed(2)}`,
    `Shipping: $${shipping.toFixed(2)}`,
    `Total: $${total.toFixed(2)}`
  ].join('\n');
}
