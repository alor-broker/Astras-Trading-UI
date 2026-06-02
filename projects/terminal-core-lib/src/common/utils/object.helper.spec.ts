import {ObjectHelper} from './object.helper';

describe('ObjectHelper', () => {
  describe('getPropertyFromPath', () => {
    it('should read a top-level property', () => {
      expect(ObjectHelper.getPropertyFromPath({a: 1}, 'a')).toBe(1);
    });

    it('should read a nested property by dotted path', () => {
      expect(ObjectHelper.getPropertyFromPath({b: {c: 1}}, 'b.c')).toBe(1);
    });

    it('should read a deeply nested property', () => {
      expect(ObjectHelper.getPropertyFromPath({a: {b: {c: {d: 'deep'}}}}, 'a.b.c.d')).toBe('deep');
    });

    it('should return undefined when the object is null or undefined', () => {
      expect(ObjectHelper.getPropertyFromPath(null, 'a')).toBeUndefined();
      expect(ObjectHelper.getPropertyFromPath(undefined, 'a')).toBeUndefined();
    });

    it('should return undefined when an intermediate segment is missing', () => {
      expect(ObjectHelper.getPropertyFromPath({b: {c: 1}}, 'b.x.y')).toBeUndefined();
    });

    it('should return undefined when an intermediate segment is not an object', () => {
      expect(ObjectHelper.getPropertyFromPath({b: 1}, 'b.c')).toBeUndefined();
    });
  });
});
