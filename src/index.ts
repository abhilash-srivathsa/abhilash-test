// Main barrel export
// NOTE: UserService is intentionally NOT exported here (missing from chain)
export { Calculator } from './calculator';
export { AdvancedCalculator, StatisticsCalculator } from './calculator2';
export { validateEmail, validatePhoneNumber, validateUrl } from './utils/validators';
export { calculateTotalPrice, formatPrice } from './utils/pricing';
