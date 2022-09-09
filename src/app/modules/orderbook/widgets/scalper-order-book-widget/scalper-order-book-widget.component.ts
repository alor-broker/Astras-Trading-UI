import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
import {
  Observable,
  shareReplay
} from 'rxjs';
import {
  DashboardItem,
  DashboardItemContentSize
} from '../../../../shared/models/dashboard-item.model';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ats-scalper-order-book-widget[shouldShowSettings][guid][resize]',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less'],
  providers: [ScalperOrderBookService]
})
export class ScalperOrderBookWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  contentSize$!: Observable<DashboardItemContentSize>;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  constructor() {
  }

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
