import {WidgetsHelper} from './widget-name.helper';
import {WidgetName} from '@terminal-core-lib/features/widgets-gallery/services/widgets-meta-service.types';

describe('WidgetsHelper', () => {
  const widgetName: WidgetName = {
    default: 'Order book',
    translations: {
      ru: 'Стакан'
    }
  };

  it('should return the default name when no language is provided', () => {
    expect(WidgetsHelper.getWidgetName(widgetName)).toBe('Order book');
  });

  it('should return the translation for a known language', () => {
    expect(WidgetsHelper.getWidgetName(widgetName, 'ru')).toBe('Стакан');
  });

  it('should fall back to the default name for an unknown language', () => {
    expect(WidgetsHelper.getWidgetName(widgetName, 'hy')).toBe('Order book');
  });
});
