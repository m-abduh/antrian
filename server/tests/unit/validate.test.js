import { describe, it, expect } from '@jest/globals';
import { validate, rules } from '../../src/middleware/validate.js';

describe('Validation Rules', () => {
  describe('required', () => {
    it('should reject empty string', () => {
      const rule = rules.required();
      expect(rule('', 'name')).toBeTruthy();
      expect(rule('  ', 'name')).toBeTruthy();
    });

    it('should accept non-empty string', () => {
      const rule = rules.required();
      expect(rule('test', 'name')).toBeNull();
    });

    it('should reject undefined', () => {
      const rule = rules.required();
      expect(rule(undefined, 'name')).toBeTruthy();
    });

    it('should reject null', () => {
      const rule = rules.required();
      expect(rule(null, 'name')).toBeTruthy();
    });
  });

  describe('string rule', () => {
    it('should reject non-string', () => {
      const rule = rules.string();
      expect(rule(123, 'name')).toBeTruthy();
    });

    it('should accept string', () => {
      const rule = rules.string();
      expect(rule('test', 'name')).toBeNull();
    });

    it('should skip undefined', () => {
      const rule = rules.string();
      expect(rule(undefined, 'name')).toBeNull();
    });
  });

  describe('number rule', () => {
    it('should reject non-number', () => {
      const rule = rules.number();
      expect(rule('abc', 'age')).toBeTruthy();
    });

    it('should accept number', () => {
      const rule = rules.number();
      expect(rule(25, 'age')).toBeNull();
    });

    it('should reject NaN', () => {
      const rule = rules.number();
      expect(rule(NaN, 'age')).toBeTruthy();
    });
  });

  describe('min/max rules', () => {
    it('should reject value below min', () => {
      const rule = rules.min(10);
      expect(rule(5, 'age')).toBeTruthy();
    });

    it('should accept value at min', () => {
      const rule = rules.min(10);
      expect(rule(10, 'age')).toBeNull();
    });

    it('should reject value above max', () => {
      const rule = rules.max(100);
      expect(rule(200, 'price')).toBeTruthy();
    });
  });

  describe('email rule', () => {
    it('should reject invalid email', () => {
      const rule = rules.email();
      expect(rule('not-an-email', 'email')).toBeTruthy();
    });

    it('should accept valid email', () => {
      const rule = rules.email();
      expect(rule('test@example.com', 'email')).toBeNull();
    });
  });

  describe('phone rule', () => {
    it('should reject invalid phone', () => {
      const rule = rules.phone();
      expect(rule('abc', 'phone')).toBeTruthy();
    });

    it('should accept valid phone', () => {
      const rule = rules.phone();
      expect(rule('+6281234567890', 'phone')).toBeNull();
    });
  });

  describe('oneOf rule', () => {
    it('should reject value not in list', () => {
      const rule = rules.oneOf(['a', 'b']);
      expect(rule('c', 'field')).toBeTruthy();
    });

    it('should accept value in list', () => {
      const rule = rules.oneOf(['a', 'b']);
      expect(rule('a', 'field')).toBeNull();
    });
  });
});

describe('calculateEstimatedTime', () => {
  it('should return 0 for no queues ahead', () => {
    expect(calculateEstimatedTime(0, 30)).toBe(0);
  });

  it('should calculate correctly', () => {
    expect(calculateEstimatedTime(3, 30)).toBe(90);
  });

  it('should handle large numbers', () => {
    expect(calculateEstimatedTime(10, 45)).toBe(450);
  });
});
