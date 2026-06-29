/**
 * Standardized auxiliary toggle shown in the settings editor aux panel.
 * Only one toggle is active at a time; the consumer reacts to the active id.
 */
export interface WidgetSettingsAuxToggle {
  /** Stable identifier used for selection/activation handling. */
  id: string;
  /** nz-icon type rendered on the toggle button. */
  icon: string;
  /** Already-translated tooltip. */
  tooltip: string;
}
