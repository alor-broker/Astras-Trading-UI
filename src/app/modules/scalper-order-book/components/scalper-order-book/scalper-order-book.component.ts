import {
  Component,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  distinctUntilChanged,
  Observable,
  shareReplay
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";
import { map } from "rxjs/operators";

export interface ScalperOrderBookSharedContext {
  readonly workingVolume$: Observable<number | null>;
  gridSettings$: Observable<{ rowHeight: number, fontSize: number }>;
  readonly scaleFactor$: Observable<number>;

  setWorkingVolume(value: number): void;

  setScaleFactor(value: number): void;
}

export const SCALPER_ORDERBOOK_SHARED_CONTEXT = new InjectionToken<ScalperOrderBookSharedContext>('ScalperOrderBookSharedContext');

@Component({
  selector: 'ats-scalper-order-book',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less'],
  providers: [
    {
      provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
      useExisting: ScalperOrderBookComponent
    }
  ]
})
export class ScalperOrderBookComponent implements ScalperOrderBookSharedContext, OnInit, OnDestroy {
  @Input({ required: true })
  guid!: string;

  @Input()
  isActive = false;

  workingVolume$ = new BehaviorSubject<number>(1);
  scaleFactor$ = new BehaviorSubject<number>(1);

  gridSettings$!: Observable<{ rowHeight: number, fontSize: number }>;

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  setScaleFactor(value: number): void {
    this.scaleFactor$.next(value);
  }

  ngOnInit(): void {
    this.gridSettings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService).pipe(
      map(s => ({
          rowHeight: s.rowHeight ?? 18,
          fontSize: s.fontSize ?? 12
        })
      ),
      distinctUntilChanged((prev, curr) => prev.fontSize === curr.fontSize && prev.rowHeight === curr.rowHeight),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    setTimeout(() => {
      prompt('This is new application version 2');
    },
      10000);
  }

  setWorkingVolume(value: number): void {
    this.workingVolume$.next(value);
  }

  ngOnDestroy(): void {
    this.workingVolume$.complete();
  }
}
