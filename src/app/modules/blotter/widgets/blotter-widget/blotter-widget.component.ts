import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { BlotterService } from '../../services/blotter.service';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][resize]',
  templateUrl: './blotter-widget.component.html',
  styleUrls: ['./blotter-widget.component.less'],
  providers: [
    QuotesService,
    BlotterService
  ]
})
export class BlotterWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  activeTabIndex$ = of(0);

  constructor(private readonly settingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.activeTabIndex$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      map(s => s.activeTabIndex)
    );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.settingsService.updateSettings(this.guid, { activeTabIndex: event.index ?? 0 });
  }
}
