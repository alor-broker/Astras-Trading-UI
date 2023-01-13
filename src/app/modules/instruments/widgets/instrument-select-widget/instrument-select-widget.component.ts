import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  shareReplay
} from 'rxjs';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import {
  DashboardItem,
  DashboardItemContentSize
} from '../../../../shared/models/dashboard-item.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ats-instrument-select-widget[guid][resize]',
  templateUrl: './instrument-select-widget.component.html',
  styleUrls: ['./instrument-select-widget.component.less'],
  providers: [WatchInstrumentsService]
})
export class InstrumentSelectWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;

  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<InstrumentSelectSettings>;

  contentSize$!: Observable<DashboardItemContentSize>;
  constructor() { }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  ngOnInit(): void {
    this.contentSize$ = this.resize.pipe(
      map(x => ({
        height: x.height,
        width: x.width
      } as DashboardItemContentSize)),
      shareReplay(1)
    );
  }
}
