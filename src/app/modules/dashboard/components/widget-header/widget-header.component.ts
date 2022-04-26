import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { getTypeBySettings, isInstrumentDependent, isPortfolioDependent } from 'src/app/shared/utils/settings-helper';
import { AnySettings } from '../../../../shared/models/settings/any-settings.model';
import { joyrideContent } from '../../models/joyride';


@Component({
  selector: 'ats-widget-header[guid][hasSettings][hasHelp]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent implements OnInit {
  @Input()
  guid!: string;
  @Input()
  hasSettings!: boolean;
  @Input()
  shouldShowSettings = false;
  @Input()
  hasHelp!: boolean;
  @Output()
  switchSettingsEvent = new EventEmitter<boolean>();
  @Output()
  linkChangedEvent = new EventEmitter<boolean>();

  joyrideContent = joyrideContent;
  settings$?: Observable<AnySettings>;
  private settings?: AnySettings;

  constructor(private dashboard: DashboardService, private modal: ModalService) { }

  ngOnInit() {
    this.settings$ = this.dashboard.getSettings(this.guid).pipe(
      filter((s) : s is AnySettings => !!s),
      map(s => {
        this.settings = s;
        const prefix = s.title?.split(' ')[0] ?? '';
        if (isInstrumentDependent(s)) {
          const group = s.instrumentGroup;
          s.title = `${prefix} ${s.symbol} ${group ? '(' + group + ')' : ''}`;
        }
        else if (isPortfolioDependent(s)) {
          s.title = `${prefix} ${s.portfolio} (${s.exchange})`;
        }
        return s;
      }),
    );
  }

  switchSettings($event: MouseEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.shouldShowSettings = !this.shouldShowSettings;
    this.switchSettingsEvent.emit(this.shouldShowSettings);
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

  openHelp() {
    if (this.settings) {
      const name = getTypeBySettings(this.settings);
      this.modal.openHelpModal(name);
    }
  }
}
