import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { ExchangeInfo } from '../../models/exchange-info.model';
import { InfoService } from '../../services/info.service';

@Component({
  selector: 'ats-info-widget',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less'],
  providers: [InfoService]
})
export class InfoWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  info$?: Observable<ExchangeInfo | null>;

  constructor(private readonly service: InfoService) {
  }

  ngOnInit(): void {
    this.service.init(this.guid);
    this.info$ = this.service.getExchangeInfo();
  }
}
