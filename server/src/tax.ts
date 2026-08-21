/**
 * Tax and delivery fee calculation for Nigerian states.
 * - VAT: 7.5% (federal, applies nationwide)
 * - State levies: vary by state
 * - Delivery fee: distance-based with minimum
 */

// Nigerian state levies (additional tax on top of VAT)
// These are example rates for a cannabis dispensary app
const STATE_LEVIES: Record<string, number> = {
  'LA': 0.05,  // Lagos — 5% (highest due to state logistics)
  'AB': 0.02,  // Abuja (FCT) — 2%
  'RI': 0.03,  // Rivers — 3%
  'OG': 0.04,  // Ogun — 4%
  'KN': 0.03,  // Kano — 3%
  'KD': 0.03,  // Kaduna — 3%
  'EN': 0.025, // Enugu — 2.5%
  'AN': 0.03,  // Anambra — 3%
  'ED': 0.03,  // Edo — 3%
  'DE': 0.025, // Delta — 2.5%
  'OI': 0.035, // Oyo — 3.5%
  'OS': 0.03,  // Osun — 3%
  'EK': 0.025, // Ekiti — 2.5%
  'ON': 0.03,  // Ondo — 3%
  'BN': 0.03,  // Benue — 3%
  'KO': 0.025, // Kogi — 2.5%
  'PL': 0.02,  // Plateau — 2%
  'BO': 0.025, // Borno — 2.5%
  'GA': 0.03,  // Gombe — 3%
  'AD': 0.02,  // Adamawa — 2%
  'TA': 0.025, // Taraba — 2.5%
};

// Default levy for states not listed
const DEFAULT_STATE_LEVY = 0.025; // 2.5%

// VAT rate (federal)
const VAT_RATE = 0.075; // 7.5%

// Delivery fee calculation
const BASE_DELIVERY_FEE = 500; // ₦500 minimum (in kobo = 50000)
const PER_KM_RATE = 150; // ₦150 per km (in kobo = 15000)
const MAX_DELIVERY_FEE = 5000; // ₦5,000 maximum (in kobo = 500000)
const FREE_DELIVERY_THRESHOLD = 10000; // Free delivery over ₦10,000 (in kobo = 1000000)

/**
 * Calculate tax for an order based on merchant's state.
 * @param subtotal - Amount in kobo
 * @param stateCode - Two-letter Nigerian state code (e.g., 'LA' for Lagos)
 * @returns Tax amount in kobo
 */
export function calculateTax(subtotal: number, stateCode?: string | null): number {
  const vat = Math.round(subtotal * VAT_RATE);
  const stateLevy = Math.round(subtotal * (STATE_LEVIES[stateCode ?? ''] ?? DEFAULT_STATE_LEVY));
  return vat + stateLevy;
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate delivery fee based on distance.
 * @param distanceKm - Distance in kilometers
 * @param subtotal - Order subtotal in kobo (for free delivery check)
 * @returns Delivery fee in kobo
 */
export function calculateDeliveryFee(distanceKm: number, subtotal: number): number {
  // Free delivery over threshold
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  
  // Calculate distance-based fee
  const fee = BASE_DELIVERY_FEE + Math.round(distanceKm * PER_KM_RATE);
  
  // Cap at maximum
  return Math.min(fee, MAX_DELIVERY_FEE);
}

/**
 * Get a human-readable breakdown of tax components.
 */
export function getTaxBreakdown(subtotal: number, stateCode?: string | null) {
  const vat = Math.round(subtotal * VAT_RATE);
  const levyRate = STATE_LEVIES[stateCode ?? ''] ?? DEFAULT_STATE_LEVY;
  const stateLevy = Math.round(subtotal * levyRate);
  
  return {
    subtotal,
    vat,
    vatRate: VAT_RATE,
    stateLevy,
    stateLevyRate: levyRate,
    stateCode: stateCode || 'NG',
    totalTax: vat + stateLevy,
  };
}
