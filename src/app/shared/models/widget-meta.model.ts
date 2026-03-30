import { DashboardType } from "./dashboard/dashboard.model";

export interface WidgetName {
  default: string;
  translations?: Record<string, string>;
}

export enum WidgetCategory {
  All = 'all',
  ChartsAndOrderbooks = 'chartsAndOrderbooks',
  PositionsTradesOrders = 'positionsTradesOrders',
  Info = 'info',
  Details = 'details'
}

export interface ApplicationAdapterConfig {
  module: string;
  componentName: string;
}

export interface WidgetDefinition {
  adapter: 'application';
  config: ApplicationAdapterConfig;
}

export interface WidgetMeta {
  /**
   * Widget's unique internal ID
   */
  typeId: string;

  definition: WidgetDefinition;

  widgetName: WidgetName;

  hasInstrumentBind?: boolean;

  category: WidgetCategory;

  isDemoOnly?: boolean;

  /**
   * Desktop specific meta information. Skip if widget is not applicable on desktop
   */
  desktopMeta?: {
    headerIcon: string;
    galleryIcon: string;
    /**
     * Options used when widget is adding to dashboard
     */
    addOptions: {
      initialPosition?: 'auto' | 'top' | 'below';
      isFullWidth: boolean;
      initialHeight?: number;
      initialHeightPx?: number;
      initialWidth?: number;
    };

    hasZeroPaddings?: boolean;

    /**
     * Used to sort widgets in gallery
     */
    galleryOrder?: number;
    enabled: boolean;
  };

  /**
   * Mobile specific meta information. Skip if widget is not applicable on mobile devices
   */
  mobileMeta?: {
    ribbonIcon: string;
    enabled: boolean;
    widgetName?: WidgetName;
    galleryOrder: number;
    galleryIcon: string;
    showOrderButtons?: boolean;
    selectableForQuickAccessPanel?: boolean;
    isOrderWidget?: boolean;
  };

  /**
   * Used to filter widgets  in gallery by current dashboard type
   */
  hideOnDashboardType?: DashboardType[];

  baseSettings?: Record<string, any>;
}
