import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { InstrumentSelectSettings } from 'src/app/shared/models/settings/instrument-select-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { InstrumentSelect } from '../../models/instrument-select.model';
import { InstrumentsService } from '../../services/instruments.service';

@Component({
  selector: 'ats-instrument-select',
  templateUrl: './instrument-select.component.html',
  styleUrls: ['./instrument-select.component.sass']
})
export class InstrumentSelectComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<InstrumentSelectSettings>;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Input('settings') set settings(settings: InstrumentSelectSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<InstrumentSelectSettings>({
    symbol: 'SBER',
    exchange: 'MOEX'
  });
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  resizeSub!: Subscription;
  instruments$: Observable<InstrumentSelect | null> = of(null);

  text$!: Observable<string>

  constructor(private service: InstrumentsService) {

  }

  ngOnInit(): void {
    this.instruments$ = this.text$.pipe(
      switchMap(t => this.service.getInstruments(t)),
    )
    this.resizeSub = this.resize.subscribe((widget) => {

    });
  }

  ngOnDestroy(): void {
    this.service.unsubscribe();
    this.resizeSub.unsubscribe();
  }

}
