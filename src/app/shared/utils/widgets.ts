import {WidgetName} from "../models/widget-meta.model";

export class WidgetsHelper {
  static getWidgetName(name: WidgetName, lang?: string): string {
    if (!(lang ?? '')) {
      return name.default;
    }

    const translation = name.translations?.[lang as string];

    return translation ?? name.default;
  }
}
