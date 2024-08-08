import {
  AfterViewInit,
  Component,
  ContentChildren,
  DestroyRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  QueryList,
} from '@angular/core';
import { PanelComponent } from "../panel/panel.component";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  ReplaySubject,
  take
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  PANELS_CONTAINER_CONTEXT,
  PanelsContainerContext
} from "../tokens";

export interface ResizedEvent {
  clientX: number;
}

@Component({
  selector: 'ats-panels-container',
  templateUrl: './panels-container.component.html',
  styleUrls: ['./panels-container.component.less'],
  providers: [
    {
      provide: PANELS_CONTAINER_CONTEXT,
      useExisting: PanelsContainerComponent
    }
  ]
})
export class PanelsContainerComponent implements PanelsContainerContext, AfterViewInit, OnDestroy {
  @ContentChildren(PanelComponent, { emitDistinctChangesOnly: true })
  panelsQuery!: QueryList<PanelComponent>;

  @Output()
  widthUpdated = new EventEmitter<Record<string, number>>();

  private lastAppliedWidths: Map<string, number> | null = null;
  private animationId = -1;
  private readonly panels = new ReplaySubject<PanelComponent[]>(1);

  constructor(
    private readonly ngZone: NgZone,
    private readonly destroyRef: DestroyRef) {
  }

  @Input({ required: true })
  set initialWidths(value: Record<string, number>) {
    if (this.lastAppliedWidths === null) {
      this.panels.pipe(
        take(1)
      ).subscribe(panels => {
        const widths = this.normalizeSavedWidths(value, panels);

        this.applyWidths(widths);
        this.lastAppliedWidths = widths;
      });
    }
  };

  ngOnDestroy(): void {
    this.panels.complete();
  }

  ngAfterViewInit(): void {
    const getPanels = (): PanelComponent[] => this.panelsQuery.map(item => item);

    this.panelsQuery.changes.pipe(
      map(() => getPanels()),
      startWith(getPanels()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => this.panels.next(x));
  }

  onPanelResized(panel: PanelComponent, event: ResizedEvent): void {
    this.panels.pipe(
      take(1)
    ).subscribe(panels => {
      const widths = this.recalculateWidths(panels, panel, event);
      if (widths) {
        this.ngZone.run(() => {
          this.applyWidths(widths);
          this.lastAppliedWidths = widths;
        });
      }
    });
  }

  onPanelResizeCompleted(): void {
    this.ngZone.run(() => this.notifyWidthChanged());
  }

  public expandPanel(panel: PanelComponent): void {
    this.panels.pipe(
      take(1)
    ).subscribe(panels => {
      if (this.lastAppliedWidths == null) {
        return;
      }

      if (panels.some(p => p.isExpanded && p.id !== panel.id)) {
        // only one panel can be expanded
        return;
      }

      const panelIndex = panels.findIndex(p => p.id === panel.id);
      if (panelIndex < 0) {
        return;
      }

      if (panelIndex === panels.length - 1) {
        // panel does not have neighbor on the right
        return;
      }

      const rightNeighborIndex = panelIndex + 1;
      const rightNeighborPanel = panels[rightNeighborIndex];

      const newWidths = new Map(this.lastAppliedWidths);
      newWidths.set(panel.id, this.roundWidth(newWidths.get(panel.id)! + newWidths.get(rightNeighborPanel.id)!));
      newWidths.set(rightNeighborPanel.id, 0);

      this.ngZone.run(() => this.applyWidths(newWidths));
    });
  }

  public restore(): void {
    if (this.lastAppliedWidths == null) {
      return;
    }

    this.ngZone.run(() => this.applyWidths(this.lastAppliedWidths!));
  }

  private roundWidth(width: number): number {
    const multiplier = Math.pow(10, 5);

    return Math.floor(width * multiplier) / multiplier;
  }

  private normalizeSavedWidths(rawWidths: Record<string, number>, panels: PanelComponent[]): Map<string, number> {
    const mappedWidths = panels.map(p => ({
      panelId: p.id,
      width: (rawWidths[p.id] as number | undefined) ?? null,
      defaultWidth: p.defaultWidthPercent
    }));

    const getFullFilledWidths = (items: { panelId: string, width: number }[]): Map<string, number> => {
      const totalWidth = items.reduce((prev, curr) => prev + curr.width, 0);
      if (totalWidth < 100) {
        return new Map(items.map((item, index) => [
          item.panelId,
          index === mappedWidths.length - 1
            ? Math.max(100 - (totalWidth - item.width), 0)
            : item.width!
        ]));
      }

      return new Map(items.map(item => [item.panelId, item.width]));
    };

    if (mappedWidths.filter(p => p.width == null).length === 0) {
      return getFullFilledWidths(mappedWidths.map(m => ({ ...m, width: m.width! })));
    }

    return getFullFilledWidths(mappedWidths.map(m => ({ ...m, width: m.defaultWidth })));
  }

  private applyWidths(widths: Map<string, number>): void {
    this.panels.pipe(
      take(1)
    ).subscribe(panels => {
      cancelAnimationFrame(this.animationId);
      this.animationId = requestAnimationFrame(() => {
        for (const panel of panels) {
          const panelWidth = widths.get(panel.id);
          if (panelWidth != null) {
            panel.applyWidth(panelWidth, '%');
          }
        }
      });
    });
  }

  private notifyWidthChanged(): void {
    if (this.lastAppliedWidths != null) {
      const widths: Record<string, number> = {};
      this.lastAppliedWidths.forEach((value, key) => widths[key] = this.roundWidth(value));
      this.widthUpdated.emit(widths);
    }
  }

  private recalculateWidths(allPanels: PanelComponent[], resizedPanel: PanelComponent, event: ResizedEvent): Map<string, number> | null {
    if (allPanels.length === 1) {
      return null;
    }

    const panelsMap = allPanels.map(p => {
      const bounds = p.getCurrentBounds();
      const currentWidth = bounds.right - bounds.left;

      return {
        id: p.id,
        panel: p,
        currentBounds: bounds,
        currentWidth: currentWidth,
        updatedWidth: currentWidth
      };
    });

    const panelIndex = panelsMap.findIndex(p => p.id === resizedPanel.id);
    if (panelIndex < 0) {
      return null;
    }

    if (panelIndex === panelsMap.length - 1) {
      // panel does not have neighbor on the right
      return null;
    }

    const rightNeighborIndex = panelIndex + 1;

    const targetPanel = panelsMap[panelIndex];
    const rightNeighborPanel = panelsMap[rightNeighborIndex];

    if (event.clientX < targetPanel.currentBounds.right) {
      // decrease width
      targetPanel.updatedWidth = Math.max(targetPanel.panel.minWidthPx, event.clientX - targetPanel.currentBounds.left);
      rightNeighborPanel.updatedWidth = rightNeighborPanel.currentBounds.right - (targetPanel.currentBounds.left + targetPanel.updatedWidth);
    } else {
      // increase width
      rightNeighborPanel.updatedWidth = Math.max(rightNeighborPanel.panel.minWidthPx, rightNeighborPanel.currentBounds.right - event.clientX);
      targetPanel.updatedWidth = rightNeighborPanel.currentBounds.right - rightNeighborPanel.updatedWidth - targetPanel.currentBounds.left;
    }

    const containerWidth = panelsMap.reduce((prev, curr) => prev + curr.updatedWidth, 0);

    return new Map<string, number>(panelsMap.map(p => [p.id, (p.updatedWidth / containerWidth) * 100]));
  }
}
