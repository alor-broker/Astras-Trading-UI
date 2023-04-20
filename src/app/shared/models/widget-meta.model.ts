export interface WidgetMeta {
  /**
   * Widget's unique internal ID
   */
  typeId: string;
  /**
   * Desktop specific meta information. Skip if widget is not applicable on desktop
   */
  desktopMeta?: {
    icon?: string;
    initialPosition?: 'auto' | 'top'
    initialHeight?: number,
    initialWidth?: 'default' | 'full-width'
  };

  /**
   * Mobile specific meta information. Skip if widget is not applicable on mobile devices
   */
  mobileMeta?: {
    icon?: string;
  }
}
