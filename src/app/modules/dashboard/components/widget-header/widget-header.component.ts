import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, finalize, tap } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';

type InstrumentDependentSettings = AnySettings & {
  symbol: string,
  exchange: string,
  instrumentGroup?: string,
  linkedToActive: boolean
}

type PortfolioDependentSettings = AnySettings & {
  portfolio: string,
  exchange: string,
  linkedToActive: boolean
}

@Component({
  selector: 'ats-widget-header[widget]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.sass']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
  @Input('widget') set widget(widget: Widget<AnySettings>) { this.widgetSubject.next(widget); };
  private widgetSubject = new BehaviorSubject<Widget<AnySettings> | null>(null);

  widget$ = this.widgetSubject.pipe(
    filter((w) : w is Widget<AnySettings> => !!w)
  );
  @Output()
  switchSettingsEvent = new EventEmitter<boolean>();

  @Output()
  settingsChangedEvent = new EventEmitter<AnySettings>();

  private shouldShowSettings = false;
  private dashboardSub!: Subscription;
  private selectedSub!: Subscription;

  constructor(private dashboard: DashboardService, private sync: SyncService) { }

  ngOnInit() {
    this.widget$.pipe(
      tap(w => this.settingsChangedEvent.emit(w.settings))
    )
    const selectedSub = this.sync.selectedInstrument$.subscribe(i => {
      const widget =  this.widgetSubject.getValue();
      const settings = widget?.settings;
      if (settings
          && this.isInstrumentDependent(settings)
          && settings.linkToActive
          && (settings.symbol != i.symbol || settings.exchange != i.exchange)) {
        settings.symbol = i.symbol;
        settings.exchange = i.exchange;
        settings.instrumentGroup = i.instrumentGroup;

        const hasGroup = i.instrumentGroup;
        widget.title = `${widget.title.split(' ')[0]} ${i.symbol} ${
          hasGroup ? `(${i.instrumentGroup})` : ''
        }`;
        this.widgetSubject.next({...widget, settings});
      }
    })
    this.dashboardSub = this.dashboard.dashboard$.subscribe(w => {
      const found = w.find(w => w.gridItem.label == this.widgetSubject.getValue()?.gridItem.label);
      if (found) {
        this.widgetSubject.next(found);
      }
    })
  }

  ngOnDestroy() {
    this.dashboardSub?.unsubscribe();
    // this.selectedSub?.unsubscribe();
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings)

  }

  removeItem($event: MouseEvent | TouchEvent, item : Widget<AnySettings>): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.removeWidget(item);
  }

  linkToActive($event: MouseEvent | TouchEvent, linkToActive: boolean) : void {
    $event.preventDefault();
    $event.stopPropagation();
    const widget = this.widgetSubject.getValue();
    if (widget) {
      const settings = {
        ...widget.settings,
        linkToActive: linkToActive
      }
      this.widgetSubject.next({...widget, settings: settings});
    }
  }

  isInstrumentDependent(settings: AnySettings) : settings is InstrumentDependentSettings {
    return settings && 'linkToActive' in settings && 'symbol' in settings && 'exchange' in settings;
  }

  isPortfolioDependent(settings: AnySettings) : settings is PortfolioDependentSettings {
    return settings && 'linkToActive' in settings && 'potfolio' in settings && 'exchange' in settings;
  }
}
