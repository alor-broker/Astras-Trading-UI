import { Component, Input, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { combineLatestWith, filter, finalize, map, tap } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { isInstrumentDependent, isPortfolioDependent } from 'src/app/shared/utils/settings-helper';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';


@Component({
  selector: 'ats-widget-header[guid]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  switchSettingsEvent = new EventEmitter<boolean>();
  @Output()
  linkChangedEvent = new EventEmitter<boolean>();

  private shouldShowSettings = false;
  private dashboardSub?: Subscription;
  private selectedSub?: Subscription;
  settings$?: Observable<AnySettings>;
  private settings?: AnySettings

  constructor(private dashboard: DashboardService, private sync: SyncService) { }

  ngOnInit() {
    this.settings$ = this.dashboard.getSettings(this.guid).pipe(
      filter((s) : s is AnySettings => !!s),
      map(s => {
        this.settings = s;
        if (isInstrumentDependent(s)) {
          const group = s.instrumentGroup;
          s.title = `${s.symbol} (${group ? group : ''})`
        }
        else if (isPortfolioDependent(s)) {
          s.title = `${s.portfolio} (${s.exchange})`
        }
        return s;
      }),
    )
  }

  ngOnDestroy() {
    this.dashboardSub?.unsubscribe();
    this.selectedSub?.unsubscribe();
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings)

  }

  removeItem($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.dashboard.removeWidget(this.guid);
  }

  linkToActive($event: MouseEvent | TouchEvent, linkToActive: boolean) : void {
    $event.preventDefault();
    $event.stopPropagation();
    if (this.settings) {
      this.dashboard.updateSettings(this.guid, { ...this.settings, linkToActive: linkToActive });
    }
  }
}
