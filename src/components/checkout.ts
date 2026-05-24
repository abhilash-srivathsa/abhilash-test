import { calculateTotalPrice, formatPrice } from '../utils/pricing';

interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
}

export function calculateCheckoutAmount(item: CheckoutItem): number {
  const baseAmount = calculateTotalPrice(item);
  const tax = baseAmount * item.taxRate;
  return baseAmount + tax;
}

export function getCheckoutSummary(items: CheckoutItem[]): string {
  const total = items.reduce((sum, item) => sum + calculateCheckoutAmount(item), 0);
  return `Total: ${formatPrice(total)}`;
}
