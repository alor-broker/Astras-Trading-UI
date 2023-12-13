import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { TimeFrameDisplayMode } from "../../models/light-chart-settings.model";
import { TimeframeValue } from "../../models/light-chart.models";
import {
  BehaviorSubject,
  take
} from "rxjs";
import { ContentSize } from "../../../../shared/models/dashboard/dashboard-item.model";
import { filter } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-timeframes-panel',
  templateUrl: './timeframes-panel.component.html',
  styleUrls: ['./timeframes-panel.component.less']
})
export class TimeframesPanelComponent implements OnDestroy, OnInit, OnChanges {
  @Input({ required: true })
  availableTimeframes: TimeframeValue[] = [];

  @Input({ required: true })
  selectedTimeframe?: TimeframeValue;

  @Input({ required: true })
  displayMode = TimeFrameDisplayMode.Buttons;

  @Output()
  changeTimeframe = new EventEmitter<TimeframeValue>();

  readonly actualDisplayMode$ = new BehaviorSubject(this.displayMode);
  timeFrameDisplayModes = TimeFrameDisplayMode;
  private readonly contentSize$ = new BehaviorSubject<ContentSize>({ height: 0, width: 0 });

  constructor(private readonly destroyRef: DestroyRef) {
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnDestroy(): void {
    this.actualDisplayMode$.complete();
    this.contentSize$.complete();
  }

  ngOnInit(): void {
    this.contentSize$.pipe(
      filter(() => this.displayMode === TimeFrameDisplayMode.Buttons),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkDisplayMode();
    });
  }

  ngOnChanges(): void {
    this.checkDisplayMode();
  }

  private checkDisplayMode(): void {
    this.actualDisplayMode$.next(this.displayMode);

    if (this.displayMode !== TimeFrameDisplayMode.Buttons) {
      return;
    }

    this.contentSize$.pipe(
      take(1)
    ).subscribe(cs => {
      const avgItemsSize = 33;
      const allItemsWidth = avgItemsSize * this.availableTimeframes.length;

      if (allItemsWidth > cs.width) {
        this.actualDisplayMode$.next(TimeFrameDisplayMode.Menu);
      } else {
        this.actualDisplayMode$.next(TimeFrameDisplayMode.Buttons);
      }
    });
  }
}
