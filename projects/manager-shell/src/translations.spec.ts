import {describe, expect, it} from 'vitest';
import {dictionary} from './translations';

describe('Manager translations', () => {
  it.each(['ru', 'hy'])('should provide every English label in %s', locale => {
    expect(Object.keys(dictionary(locale)).sort()).toEqual(Object.keys(dictionary('en')).sort());
    expect(Object.values(dictionary(locale)).every(value => value.length > 0)).toBe(true);
  });
});
