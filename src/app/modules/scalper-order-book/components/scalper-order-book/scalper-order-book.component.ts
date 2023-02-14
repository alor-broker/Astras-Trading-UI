import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ScalperOrderBookSettings } from '../../models/scalper-order-book-settings.model';

@Component({
  selector: 'ats-scalper-order-book[guid][isActive]',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less']
})
export class ScalperOrderBookComponent implements OnInit {
  @Input() guid!: string;

  @Input()
  isActive: boolean = false;

  settings$!: Observable<ScalperOrderBookSettings>;

  workingVolume$ = new BehaviorSubject<number | null>(null);

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<ScalperOrderBookSettings>(this.guid).pipe(
      shareReplay(1)
    );
  }

  switchEnableAutoAlign() {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.widgetSettingsService.updateSettings<ScalperOrderBookSettings>(
        s.guid,
        {
          enableAutoAlign: !(s.enableAutoAlign ?? true)
        });
    });
  }
}
