import {NewYearHelper} from './new-year.helper';

describe('NewYearHelper', () => {
  describe('showNewYearIcon', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function freezeAt(isoDate: string): void {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(isoDate));
    }

    it('should show the icon in December', () => {
      freezeAt('2026-12-01T10:00:00');

      expect(NewYearHelper.showNewYearIcon()).toBe(true);
    });

    it('should show the icon before 14 January', () => {
      freezeAt('2026-01-13T23:00:00');

      expect(NewYearHelper.showNewYearIcon()).toBe(true);
    });

    it('should hide the icon on and after 14 January', () => {
      freezeAt('2026-01-14T00:00:00');

      expect(NewYearHelper.showNewYearIcon()).toBe(false);
    });

    it('should hide the icon outside the holiday window', () => {
      freezeAt('2026-06-15T12:00:00');

      expect(NewYearHelper.showNewYearIcon()).toBe(false);
    });
  });
});
