import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ScalperOrderBookWidgetSettings } from '../../models/scalper-order-book-settings.model';
import { ScalperSettingsHelper } from "../../utils/scalper-settings.helper";

@Component({
  selector: 'ats-scalper-order-book',
  templateUrl: './scalper-order-book.component.html',
  styleUrls: ['./scalper-order-book.component.less']
})
export class ScalperOrderBookComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  @Input()
  isActive = false;

  settings$!: Observable<ScalperOrderBookWidgetSettings>;

  workingVolume$ = new BehaviorSubject<number | null>(null);

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = ScalperSettingsHelper.getSettingsStream(this.guid, this.widgetSettingsService);
  }
}
