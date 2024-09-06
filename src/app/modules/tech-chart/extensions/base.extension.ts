import { TechChartSettings } from "../models/tech-chart-settings.model";
import { ThemeSettings } from "../../../shared/models/settings/theme-settings.model";
import {
  IChartingLibraryWidget,
  IChartWidgetApi
} from "../../../../assets/charting_library";

export interface ChartContext {
  settings: TechChartSettings;
  theme: ThemeSettings;
  host: IChartingLibraryWidget;
}

export abstract class BaseExtension {
  abstract apply(context: ChartContext): void;
  abstract update(context: ChartContext): void;
  abstract destroyState(): void;

  protected getChartApi(context: ChartContext): IChartWidgetApi {
    return context.host.activeChart();
  }
}
