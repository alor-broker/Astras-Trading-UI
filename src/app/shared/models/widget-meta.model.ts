export interface WidgetName {
  default: string;
  translations?: {
    [key: string]: string;
  }
}

export interface ApplicationAdapterConfig {
  module: string;
  componentName: string;
}

export interface WidgetDefinition {
  adapter: 'application',
  config: ApplicationAdapterConfig
}

export interface WidgetMeta {
  /**
   * Widget's unique internal ID
   */
  typeId: string;

  definition: WidgetDefinition;

  widgetName: WidgetName;

  hasInstrumentBind?: boolean;

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
      initialPosition?: 'auto' | 'top'
      isFullWidth: boolean
      initialHeight?: number,
      initialHeightPx?: number,
      initialWidth?: number
    },

    /**
     * Used to sort widgets in gallery (widgets menu)
     */
    galleryOrder: number;
    enabled: boolean;
  };

  /**
   * Mobile specific meta information. Skip if widget is not applicable on mobile devices
   */
  mobileMeta?: {
    ribbonIcon: string;
    enabled: boolean;
    widgetName?: WidgetName;
  }
}
