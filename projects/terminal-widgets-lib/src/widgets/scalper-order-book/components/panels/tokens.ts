import {Subject} from "rxjs";
import {InjectionToken} from "@angular/core";
import {ResizedEvent} from '@terminal-widgets-lib/widgets/scalper-order-book/components/panels/panels-container/panels-container';
import {Panel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/panels/panel/panel.component';

export interface PanelResizeContext {
  readonly resizedOutsideAngular$: Subject<ResizedEvent>;
  readonly resizeEndOutsideAngular$: Subject<void>;
}

export const PANEL_RESIZE_CONTEXT = new InjectionToken<PanelResizeContext>('PanelResizeContext');

export interface PanelsContainerContext {
  onPanelResized(panel: Panel, event: ResizedEvent): void;

  onPanelResizeCompleted(): void;

  expandPanel(panel: Panel): void;

  restore(): void;
}

export const PANELS_CONTAINER_CONTEXT = new InjectionToken<PanelsContainerContext>('PanelsContainerContext');
