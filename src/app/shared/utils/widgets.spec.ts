import { WidgetsHelper } from './widgets';
import { WidgetName } from '../models/widget-meta.model';

describe('WidgetsHelper', () => {
  describe('getWidgetName', () => {
    const mockWidgetName: WidgetName = {
      default: 'Default Name',
      translations: {
        en: 'English Name',
        ru: 'Русское имя',
      },
    };

    const mockWidgetNameNoTranslations: WidgetName = {
      default: 'Default Name Only',
    };

    it('should return the default name if lang is null', () => {
      expect(WidgetsHelper.getWidgetName(mockWidgetName)).toBe(mockWidgetName.default);
    });

    it('should return the default name if lang is an empty string', () => {
      expect(WidgetsHelper.getWidgetName(mockWidgetName, '')).toBe(mockWidgetName.default);
    });

    it('should return the translated name if lang is provided and translation exists', () => {
      expect(WidgetsHelper.getWidgetName(mockWidgetName, 'en')).toBe(mockWidgetName.translations!.en);
      expect(WidgetsHelper.getWidgetName(mockWidgetName, 'ru')).toBe(mockWidgetName.translations!.ru);
    });

    it('should return the default name if lang is provided but translation does not exist', () => {
      expect(WidgetsHelper.getWidgetName(mockWidgetName, 'fr')).toBe(mockWidgetName.default);
    });

    it('should return the default name if translations object is undefined', () => {
      expect(WidgetsHelper.getWidgetName(mockWidgetNameNoTranslations, 'en')).toBe(mockWidgetNameNoTranslations.default);
    });

    it('should return the default name if translations object is null', () => {
      const widgetNameWithNullTranslations: WidgetName = {
        default: 'Default With Null Translations'
      };
      expect(WidgetsHelper.getWidgetName(widgetNameWithNullTranslations, 'en')).toBe(widgetNameWithNullTranslations.default);
    });

    it('should return the default name if translations object is empty', () => {
      const widgetNameWithEmptyTranslations: WidgetName = {
        default: 'Default With Empty Translations',
        translations: {}
      };
      expect(WidgetsHelper.getWidgetName(widgetNameWithEmptyTranslations, 'en')).toBe(widgetNameWithEmptyTranslations.default);
    });
  });
});
