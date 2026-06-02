export interface WidgetTarget {
  typeId: string;
  instanceId?: string;
  parameters?: any;
}

export interface NavigationState {
  isFinal?: boolean;
  widgetTarget: WidgetTarget;
}
