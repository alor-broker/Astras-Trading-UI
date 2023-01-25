import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { NewsSettings } from '../../models/news-settings.model';

@Component({
  selector: 'ats-news-widget[guid][shouldShowSettings][isBlockWidget]',
  templateUrl: './news-widget.component.html',
  styleUrls: ['./news-widget.component.less']
})
export class NewsWidgetComponent implements OnInit {

  @Input() public shouldShowSettings!: boolean;
  @Input() public guid!: string;
  @Input()
  isBlockWidget!: boolean;
  @Output() public shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<NewsSettings>(
      this.guid,
      'NewsSettings',
      settings => ({
        ...settings
      }),
      this.widgetSettingsService
    );
  }
}
