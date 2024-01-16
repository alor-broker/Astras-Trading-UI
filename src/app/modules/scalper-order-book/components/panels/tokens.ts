import { Subject } from "rxjs";
import { ResizedEvent } from "./panels-container/panels-container.component";
import { InjectionToken } from "@angular/core";
import { PanelComponent } from "./panel/panel.component";

export interface PanelResizeContext {
  readonly resizedOutsideAngular$: Subject<ResizedEvent>;
  readonly resizeEndOutsideAngular$: Subject<void>;
}

export const PANEL_RESIZE_CONTEXT = new InjectionToken<PanelResizeContext>('PanelResizeContext');

export interface PanelsContainerContext {
  onPanelResized(panel: PanelComponent, event: ResizedEvent): void;

  onPanelResizeCompleted(): void;

  expandPanel(panel: PanelComponent): void;

  restore(): void;
}

export const PANELS_CONTAINER_CONTEXT = new InjectionToken<PanelsContainerContext>('PanelsContainerContext');
