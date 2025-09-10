import {
  InstrumentDependentSettings,
  isInstrumentDependent,
  isInstrumentEqual,
  isEqualPortfolioDependedSettings,
  isPortfolioDependent,
  PortfolioDependentSettings,
  SettingsHelper
} from './settings-helper';
import { WidgetSettings } from '../models/widget-settings.model';
import { WidgetSettingsService } from '../services/widget-settings.service';
import { TerminalSettingsService } from '../services/terminal-settings.service';
import { of } from 'rxjs';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { TerminalSettings } from '../models/terminal-settings/terminal-settings.model';

describe('SettingsHelper', () => {
  describe('isInstrumentDependent', () => {
    it('should return true if settings are instrument dependent', () => {
      const settings: InstrumentDependentSettings = {
        guid: 'guid',
        linkToActive: true,
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR'
      };
      expect(isInstrumentDependent(settings)).toBeTrue();
    });

    it('should return false if settings are not instrument dependent (missing linkToActive)', () => {
      const settings = {
        guid: 'guid',
        symbol: 'SBER',
        exchange: 'MOEX'
      } as WidgetSettings;
      expect(isInstrumentDependent(settings)).toBeFalse();
    });

    it('should return false if settings are not instrument dependent (missing symbol)', () => {
      const settings = {
        guid: 'guid',
        linkToActive: true,
        exchange: 'MOEX'
      } as WidgetSettings;
      expect(isInstrumentDependent(settings)).toBeFalse();
    });

    it('should return false if settings are not instrument dependent (missing exchange)', () => {
      const settings = {
        guid: 'guid',
        linkToActive: true,
        symbol: 'SBER'
      } as WidgetSettings;
      expect(isInstrumentDependent(settings)).toBeFalse();
    });

    it('should return false for empty settings', () => {
      const settings = {} as WidgetSettings;
      expect(isInstrumentDependent(settings)).toBeFalse();
    });
  });

  describe('isPortfolioDependent', () => {
    it('should return true if settings are portfolio dependent', () => {
      const settings: PortfolioDependentSettings = {
        guid: 'guid',
        linkToActive: true,
        portfolio: 'D1234',
        exchange: 'MOEX'
      };
      expect(isPortfolioDependent(settings)).toBeTrue();
    });

    it('should return false if settings are not portfolio dependent (missing linkToActive)', () => {
      const settings = {
        guid: 'guid',
        portfolio: 'D1234',
        exchange: 'MOEX'
      } as WidgetSettings;
      expect(isPortfolioDependent(settings)).toBeFalse();
    });

    it('should return false if settings are not portfolio dependent (missing portfolio)', () => {
      const settings = {
        guid: 'guid',
        linkToActive: true,
        exchange: 'MOEX'
      } as WidgetSettings;
      expect(isPortfolioDependent(settings)).toBeFalse();
    });

    it('should return false if settings are not portfolio dependent (missing exchange)', () => {
      const settings = {
        guid: 'guid',
        linkToActive: true,
        portfolio: 'D1234'
      } as WidgetSettings;
      expect(isPortfolioDependent(settings)).toBeFalse();
    });

    it('should return false for empty settings', () => {
      const settings = {} as WidgetSettings;
      expect(isPortfolioDependent(settings)).toBeFalse();
    });
  });

  describe('isEqualPortfolioDependedSettings', () => {
    const s1: PortfolioDependentSettings = { guid: 'g', portfolio: 'P1', exchange: 'E1', linkToActive: true, badgeColor: 'red' };
    const s2: PortfolioDependentSettings = { guid: 'g', portfolio: 'P1', exchange: 'E1', linkToActive: true, badgeColor: 'red' };
    const s3: PortfolioDependentSettings = { guid: 'g', portfolio: 'P2', exchange: 'E1', linkToActive: true, badgeColor: 'red' };
    const s4: PortfolioDependentSettings = { guid: 'g', portfolio: 'P1', exchange: 'E2', linkToActive: true, badgeColor: 'red' };
    const s5: PortfolioDependentSettings = { guid: 'g', portfolio: 'P1', exchange: 'E1', linkToActive: false, badgeColor: 'red' };
    const s6: PortfolioDependentSettings = { guid: 'g', portfolio: 'P1', exchange: 'E1', linkToActive: true, badgeColor: 'blue' };

    it('should return true for equal settings', () => {
      expect(isEqualPortfolioDependedSettings(s1, s2)).toBeTrue();
    });

    it('should return false for different portfolios', () => {
      expect(isEqualPortfolioDependedSettings(s1, s3)).toBeFalse();
    });

    it('should return false for different exchanges', () => {
      expect(isEqualPortfolioDependedSettings(s1, s4)).toBeFalse();
    });

    it('should return false for different linkToActive', () => {
      expect(isEqualPortfolioDependedSettings(s1, s5)).toBeFalse();
    });

    it('should return false for different badgeColor', () => {
      expect(isEqualPortfolioDependedSettings(s1, s6)).toBeFalse();
    });

    it('should handle null or undefined inputs', () => {
      expect(isEqualPortfolioDependedSettings(s1, null)).toBeFalse();
      expect(isEqualPortfolioDependedSettings(null, s2)).toBeFalse();
      expect(isEqualPortfolioDependedSettings(null, null)).toBeTrue();
      expect(isEqualPortfolioDependedSettings(undefined, undefined)).toBeTrue();
      expect(isEqualPortfolioDependedSettings(s1, undefined)).toBeFalse();
      expect(isEqualPortfolioDependedSettings(undefined, s2)).toBeFalse();
    });
  });

  describe('isInstrumentEqual', () => {
    const i1: InstrumentKey = { symbol: 'S1', exchange: 'E1', instrumentGroup: 'G1' };
    const i2: InstrumentKey = { symbol: 'S1', exchange: 'E1', instrumentGroup: 'G1' };
    const i3: InstrumentKey = { symbol: 'S2', exchange: 'E1', instrumentGroup: 'G1' };
    const i4: InstrumentKey = { symbol: 'S1', exchange: 'E2', instrumentGroup: 'G1' };
    const i5: InstrumentKey = { symbol: 'S1', exchange: 'E1', instrumentGroup: 'G2' };
    const i6: InstrumentKey = { symbol: 'S1', exchange: 'E1' }; // Missing instrumentGroup
    const i7: InstrumentKey = { symbol: 'S1', exchange: 'E1' }; // Missing instrumentGroup

    it('should return true for equal instruments', () => {
      expect(isInstrumentEqual(i1, i2)).toBeTrue();
    });

    it('should return true for equal instruments when instrumentGroup is undefined in both', () => {
      expect(isInstrumentEqual(i6, i7)).toBeTrue();
    });

    it('should return false for different symbols', () => {
      expect(isInstrumentEqual(i1, i3)).toBeFalse();
    });

    it('should return false for different exchanges', () => {
      expect(isInstrumentEqual(i1, i4)).toBeFalse();
    });

    it('should return false for different instrumentGroups', () => {
      expect(isInstrumentEqual(i1, i5)).toBeFalse();
    });

    it('should return false if one instrumentGroup is undefined', () => {
      expect(isInstrumentEqual(i1, i6)).toBeFalse();
      expect(isInstrumentEqual(i6, i1)).toBeFalse();
    });

    it('should handle null or undefined inputs', () => {
      expect(isInstrumentEqual(i1, null)).toBeFalse();
      expect(isInstrumentEqual(null, i2)).toBeFalse();
      expect(isInstrumentEqual(null, null)).toBeTrue();
      expect(isInstrumentEqual(undefined, undefined)).toBeTrue();
      expect(isInstrumentEqual(i1, undefined)).toBeFalse();
      expect(isInstrumentEqual(undefined, i2)).toBeFalse();
    });
  });

  describe('SettingsHelper.showBadge', () => {
    let widgetSettingsServiceSpy: jasmine.SpyObj<WidgetSettingsService>;
    let terminalSettingsServiceSpy: jasmine.SpyObj<TerminalSettingsService>;
    const widgetGuid = 'testGuid';

    beforeEach(() => {
      widgetSettingsServiceSpy = jasmine.createSpyObj('WidgetSettingsService', ['getSettings']);
      terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);
    });

    it('should return true if badgesBind is true, linkToActive is true (or default), and badgeColor is set', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: true, badgeColor: 'red' } as WidgetSettings));
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: true } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
    });

    it('should return true if badgesBind is true, linkToActive is undefined (default true), and badgeColor is set', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ badgeColor: 'red' } as WidgetSettings)); // linkToActive is undefined
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: true } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeTrue();
        done();
      });
    });

    it('should return false if badgesBind is false', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: true, badgeColor: 'red' } as WidgetSettings));
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: false } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false if linkToActive is false', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: false, badgeColor: 'red' } as WidgetSettings));
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: true } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false if badgeColor is null', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: true, badgeColor: null } as any));
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: true } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should return false if badgeColor is undefined', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: true } as WidgetSettings)); // badgeColor is undefined
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: true } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });

    it('should correctly combine all conditions leading to false', (done) => {
      widgetSettingsServiceSpy.getSettings.and.returnValue(of({ linkToActive: false } as WidgetSettings));
      terminalSettingsServiceSpy.getSettings.and.returnValue(of({ badgesBind: false } as TerminalSettings));

      SettingsHelper.showBadge(widgetGuid, widgetSettingsServiceSpy, terminalSettingsServiceSpy).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });
    });
  });
});
