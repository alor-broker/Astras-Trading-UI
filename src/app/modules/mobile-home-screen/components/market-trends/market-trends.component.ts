import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { MobileHomeScreenSettings } from "../../models/mobile-home-screen-settings.model";
import { LoadingEvent } from "../../models/components.model";

@Component({
  selector: 'ats-market-trends',
  standalone: true,
  imports: [],
  templateUrl: './market-trends.component.html',
  styleUrl: './market-trends.component.less'
})
export class MarketTrendsComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  @Output()
  loadingChanged = new EventEmitter<LoadingEvent>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    const settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid);
  }

  private riseLoadingChanged(loading: boolean): void {
    setTimeout(() => {
      this.loadingChanged.emit({loading, source: 'market-trends'});
    });
  }
}
