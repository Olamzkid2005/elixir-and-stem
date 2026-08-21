import { calculateTax, calculateDeliveryFee, calculateDistance, getTaxBreakdown } from '../src/tax';

describe('Tax Calculation', () => {
  describe('calculateTax', () => {
    it('should calculate VAT (7.5%) + state levy for Lagos', () => {
      const subtotal = 10000; // ₦100 in kobo
      const tax = calculateTax(subtotal, 'LA');
      const expectedVat = Math.round(10000 * 0.075); // 750
      const expectedLevy = Math.round(10000 * 0.05); // 500 (Lagos 5%)
      expect(tax).toBe(expectedVat + expectedLevy); // 1250
    });

    it('should calculate VAT + state levy for Abuja', () => {
      const subtotal = 10000;
      const tax = calculateTax(subtotal, 'AB');
      const expectedVat = Math.round(10000 * 0.075); // 750
      const expectedLevy = Math.round(10000 * 0.02); // 200 (Abuja 2%)
      expect(tax).toBe(expectedVat + expectedLevy); // 950
    });

    it('should calculate VAT + state levy for Rivers', () => {
      const subtotal = 10000;
      const tax = calculateTax(subtotal, 'RI');
      const expectedVat = Math.round(10000 * 0.075); // 750
      const expectedLevy = Math.round(10000 * 0.03); // 300 (Rivers 3%)
      expect(tax).toBe(expectedVat + expectedLevy); // 1050
    });

    it('should use default levy for unknown states', () => {
      const subtotal = 10000;
      const tax = calculateTax(subtotal, 'XX');
      const expectedVat = Math.round(10000 * 0.075); // 750
      const expectedLevy = Math.round(10000 * 0.025); // 250 (default 2.5%)
      expect(tax).toBe(expectedVat + expectedLevy); // 1000
    });

    it('should use default levy when stateCode is null', () => {
      const subtotal = 10000;
      const tax = calculateTax(subtotal, null);
      expect(tax).toBeGreaterThan(0);
    });

    it('should return 0 for zero subtotal', () => {
      expect(calculateTax(0, 'LA')).toBe(0);
    });
  });

  describe('getTaxBreakdown', () => {
    it('should return detailed breakdown for Lagos', () => {
      const subtotal = 10000;
      const breakdown = getTaxBreakdown(subtotal, 'LA');

      expect(breakdown.subtotal).toBe(10000);
      expect(breakdown.vatRate).toBe(0.075);
      expect(breakdown.stateLevyRate).toBe(0.05);
      expect(breakdown.stateCode).toBe('LA');
      expect(breakdown.vat).toBe(750);
      expect(breakdown.stateLevy).toBe(500);
      expect(breakdown.totalTax).toBe(1250);
    });

    it('should handle null stateCode', () => {
      const breakdown = getTaxBreakdown(10000, null);
      expect(breakdown.stateCode).toBe('NG');
    });
  });
});

describe('Distance Calculation', () => {
  it('should calculate distance between two points', () => {
    // Lagos (6.5244, 3.3792) to Abuja (9.0579, 7.4951)
    const distance = calculateDistance(6.5244, 3.3792, 9.0579, 7.4951);
    // Should be approximately 500-600 km
    expect(distance).toBeGreaterThan(400);
    expect(distance).toBeLessThan(700);
  });

  it('should return 0 for same point', () => {
    const distance = calculateDistance(6.5244, 3.3792, 6.5244, 3.3792);
    expect(distance).toBe(0);
  });

  it('should handle nearby points', () => {
    // Two points in Lagos
    const distance = calculateDistance(6.4281, 3.4219, 6.43, 3.42);
    // Should be very close (less than 1 km)
    expect(distance).toBeLessThan(1);
  });
});

describe('Delivery Fee Calculation', () => {
  it('should calculate distance-based fee', () => {
    const distance = 5; // 5 km
    const subtotal = 5000; // ₦50 in kobo
    const fee = calculateDeliveryFee(distance, subtotal);

    // Base fee (500) + (5 km × 150/km) = 500 + 750 = 1250
    expect(fee).toBe(1250);
  });

  it('should apply minimum fee for short distances', () => {
    const fee = calculateDeliveryFee(0.1, 5000); // 100 meters
    expect(fee).toBeGreaterThanOrEqual(500); // minimum fee
  });

  it('should cap at maximum fee', () => {
    const fee = calculateDeliveryFee(100, 5000); // 100 km
    expect(fee).toBeLessThanOrEqual(5000); // max fee
  });

  it('should give free delivery over threshold', () => {
    const fee = calculateDeliveryFee(5, 15000); // ₦150 subtotal
    expect(fee).toBe(0);
  });

  it('should not give free delivery under threshold', () => {
    const fee = calculateDeliveryFee(5, 5000); // ₦50 subtotal
    expect(fee).toBeGreaterThan(0);
  });

  it('should handle zero distance', () => {
    const fee = calculateDeliveryFee(0, 5000);
    expect(fee).toBe(500); // base fee only
  });
});
