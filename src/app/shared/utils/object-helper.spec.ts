import { getPropertyFromPath, getValueOrDefault } from './object-helper';

describe('ObjectHelper', () => {
  describe('getPropertyFromPath', () => {
    const testObj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      },
      f: null
    };

    it('should return the correct value for a simple path', () => {
      expect(getPropertyFromPath(testObj, 'a')).toBe(testObj.a);
    });

    it('should return the correct value for a nested path', () => {
      expect(getPropertyFromPath(testObj, 'b.c')).toBe(testObj.b.c);
    });

    it('should return the correct value for a deeply nested path', () => {
      expect(getPropertyFromPath(testObj, 'b.d.e')).toBe(testObj.b.d.e);
    });

    it('should return undefined for a path that does not exist', () => {
      expect(getPropertyFromPath(testObj, 'x.y.z')).toBeUndefined();
    });

    it('should return undefined if an intermediate path is null', () => {
      expect(getPropertyFromPath(testObj, 'f.g')).toBeUndefined();
    });

    it('should return undefined if an intermediate path does not exist', () => {
      expect(getPropertyFromPath(testObj, 'b.x.e')).toBeUndefined();
    });

    it('should return undefined for an empty path string', () => {
      // Behavior for empty path might depend on stricter function definition,
      // current implementation would try to access obj['']
      // Depending on desired behavior, this might need adjustment in the main function
      expect(getPropertyFromPath(testObj, '')).toBeUndefined();
    });

    it('should handle paths leading to null or undefined values correctly', () => {
      const objWithNull = { a: { b: null } };
      expect(getPropertyFromPath(objWithNull, 'a.b')).toBeNull();
      const objWithUndefined = { a: { b: undefined } };
      expect(getPropertyFromPath(objWithUndefined, 'a.b')).toBeUndefined();
    });

    it('should return undefined when the object is null', () => {
      expect(getPropertyFromPath(null, 'a.b')).toBeUndefined();
    });

    it('should return undefined when the object is undefined', () => {
      expect(getPropertyFromPath(undefined, 'a.b')).toBeUndefined();
    });

    it('should access properties through array indices in path', () => {
      const objWithArray = { a: [{ b: 10 }, { c: 20 }] };
      expect(getPropertyFromPath(objWithArray, 'a.0.b')).toBe(10);
      expect(getPropertyFromPath(objWithArray, 'a.1.c')).toBe(20);
      expect(getPropertyFromPath(objWithArray, 'a.1.x')).toBeUndefined();
    });
  });

  describe('getValueOrDefault', () => {
    it('should return the original value if it is not null', () => {
      expect(getValueOrDefault('hello', 'default')).toBe('hello');
      expect(getValueOrDefault(123, 0)).toBe(123);
      expect(getValueOrDefault(false, true)).toBe(false);
      const obj = { key: 'value' };
      expect(getValueOrDefault(obj, { key: 'default' })).toBe(obj);
    });

    it('should return the default value if the original value is null', () => {
      expect(getValueOrDefault(null, 'default')).toBe('default');
      expect(getValueOrDefault(null, 0)).toBe(0);
      expect(getValueOrDefault(null, true)).toBe(true);
      const defaultObj = { key: 'default' };
      expect(getValueOrDefault(null, defaultObj)).toBe(defaultObj);
    });

    it('should return the default value if the original value is undefined (coerced to null by ??)', () => {
      expect(getValueOrDefault(undefined, 'default')).toBe('default');
      expect(getValueOrDefault(undefined, 0)).toBe(0);
    });

    it('should return NaN if the original value is NaN and not null/undefined', () => {
      // When value is NaN (number), defaultValue must also be a number.
      expect(getValueOrDefault(NaN, 0)).toBeNaN(); // Changed 'default' to 0
      expect(getValueOrDefault(NaN, 123)).toBeNaN();
    });
  });
});
