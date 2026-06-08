import {
  InjectionToken,
  Type
} from '@angular/core';

/**
 * Maps widgetType string to a component class that extends WidgetBase.
 * Each project provides its own registry for tree-shaking.
 */
export type WidgetComponentRegistry = Map<string, Type<unknown>>;

/**
 * DI token for providing project-specific widget component registries.
 */
export const WIDGET_COMPONENT_REGISTRY = new InjectionToken<WidgetComponentRegistry>(
  'WIDGET_COMPONENT_REGISTRY'
);
