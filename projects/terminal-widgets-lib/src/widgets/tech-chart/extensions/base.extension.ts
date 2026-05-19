import {TechChartWidgetSettings} from '@terminal-widgets-lib/widgets/tech-chart/widget-settings.types';
import {ThemeSettings} from '@terminal-core-lib/features/themes/themes.types';
import {
  IChartingLibraryWidget,
  IChartWidgetApi
} from '@terminal-widgets-lib/assets/charting_library';

export interface ChartContext {
  settings: TechChartWidgetSettings;
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
