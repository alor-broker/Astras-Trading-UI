export interface WidgetTarget {
  typeId: string;
  instanceId?: string;
  parameters?: Record<string, unknown>;
}

export interface NavigationState {
  isFinal?: boolean;
  widgetTarget: WidgetTarget;
}
