import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  take
} from "rxjs";
import {filter} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {LetDirective} from '@ngrx/component';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {TimeframeValue} from '@terminal-widgets-lib/widgets/light-chart/types/light-chart.types';
import {TimeFrameDisplayMode} from '@terminal-widgets-lib/widgets/light-chart/widget-settings.types';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';

@Component({
  selector: 'ats-timeframes-panel',
  templateUrl: './timeframes-panel.html',
  styleUrls: ['./timeframes-panel.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    LetDirective,
    NzResizeObserverDirective,
    TranslocoDirective,
    NzButtonComponent,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzDropdownDirective
  ]
})
export class TimeframesPanel implements OnDestroy, OnInit, OnChanges {
  readonly availableTimeframes = input.required<TimeframeValue[]>();

  readonly selectedTimeframe = input.required<TimeframeValue | undefined>();

  readonly displayMode = input<TimeFrameDisplayMode>(TimeFrameDisplayMode.Buttons);

  readonly changeTimeframe = output<TimeframeValue>();

  readonly actualDisplayMode$ = new BehaviorSubject(this.displayMode());

  timeFrameDisplayModes = TimeFrameDisplayMode;

  private readonly destroyRef = inject(DestroyRef);

  private readonly contentSize$ = new BehaviorSubject<ContentSize>({height: 0, width: 0});

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
      filter(() => this.displayMode() === TimeFrameDisplayMode.Buttons),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.checkDisplayMode();
    });
  }

  ngOnChanges(): void {
    this.checkDisplayMode();
  }

  private checkDisplayMode(): void {
    const displayMode = this.displayMode();
    this.actualDisplayMode$.next(displayMode);

    if (displayMode !== TimeFrameDisplayMode.Buttons) {
      return;
    }

    this.contentSize$.pipe(
      take(1)
    ).subscribe(cs => {
      const avgItemsSize = 33;
      const allItemsWidth = avgItemsSize * this.availableTimeframes().length;

      if (allItemsWidth > cs.width) {
        this.actualDisplayMode$.next(TimeFrameDisplayMode.Menu);
      } else {
        this.actualDisplayMode$.next(TimeFrameDisplayMode.Buttons);
      }
    });
  }
}
