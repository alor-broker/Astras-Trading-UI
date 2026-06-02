import {WidgetName} from '../services/widgets-meta-service.types';

export class WidgetsHelper {
  static getWidgetName(name: WidgetName, lang?: string): string {
    if (lang == null || !lang.length) {
      return name.default;
    }

    const translation = name.translations?.[lang];

    return translation ?? name.default;
  }
}
