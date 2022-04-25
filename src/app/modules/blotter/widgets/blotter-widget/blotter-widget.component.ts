import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NzTabChangeEvent } from 'ng-zorro-antd/tabs';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { BlotterService } from '../../services/blotter.service';
import { QuotesService } from '../../../../shared/services/quotes.service';

@Component({
  selector: 'ats-blotter-widget[shouldShowSettings][guid][linkedToActive][resize]',
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
  set linkedToActive(linkedToActive: boolean) {
    this.service.setLinked(linkedToActive);
  }
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  activeTabIndex$ = of(0);

  constructor(private service: BlotterService) { }

  ngOnInit(): void {
    this.activeTabIndex$ = this.service.getSettings(this.guid).pipe(
      map(s => s.activeTabIndex)
    );
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  onIndexChange(event: NzTabChangeEvent) {
    this.service.setTabIndex(event.index ?? 0);
  }
}
