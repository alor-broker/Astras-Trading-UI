export interface DashboardItemPosition {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

export interface Widget {
  guid: string;
  widgetType: string;
  position?: DashboardItemPosition;

  initialSettings?: any;
  initialSize?: {
    cols: number;
    rows: number;
  };
}
