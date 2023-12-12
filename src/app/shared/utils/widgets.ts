import { WidgetName } from "../models/widget-meta.model";

export class WidgetsHelper {
  static getWidgetName(name: WidgetName, lang?: string): string {
    if (lang == null || !lang.length) {
      return name.default;
    }

    const translation = name.translations?.[lang];

    return translation ?? name.default;
  }
}
