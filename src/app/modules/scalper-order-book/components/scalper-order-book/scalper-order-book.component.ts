import {
  Component,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ScalperOrderBookWidgetSettings } from '../../models/scalper-order-book-settings.model';
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";

export interface ScalperOrderBookSharedContext {
  readonly workingVolume$: Observable<number | null>;

  setWorkingVolume(value: number): void;
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

  settings$!: Observable<ScalperOrderBookWidgetSettings>;

  workingVolume$ = new BehaviorSubject<number | null>(null);

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService);
  }

  setWorkingVolume(value: number): void {
    this.workingVolume$.next(value);
  }

  ngOnDestroy(): void {
    this.workingVolume$.complete();
  }
}
