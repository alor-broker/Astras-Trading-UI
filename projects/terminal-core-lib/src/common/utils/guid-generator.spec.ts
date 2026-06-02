import {GuidGenerator} from './guid-generator';

describe('GuidGenerator', () => {
  describe('newGuid', () => {
    // RFC4122 version 4 shape: third group starts with 4, fourth group starts with 8/9/a/b.
    const guidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    it('should produce a value matching the version 4 GUID format', () => {
      expect(GuidGenerator.newGuid()).toMatch(guidV4Pattern);
    });

    it('should produce a different value on each call', () => {
      const guids = new Set(Array.from({length: 50}, () => GuidGenerator.newGuid()));

      expect(guids.size).toBe(50);
    });
  });
});
