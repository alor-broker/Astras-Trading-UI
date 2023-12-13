import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { DeviceService } from "../../services/device.service";
import {
  Observable,
  shareReplay
} from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-widget-settings',
  templateUrl: './widget-settings.component.html',
  styleUrls: ['./widget-settings.component.less']
})
export class WidgetSettingsComponent implements OnInit {

  @Input({ required: true })
  canSave = false;

  @Output()
  saveClick = new EventEmitter();

  @Input()
  showCopy = false;

  @Input({ required: true })
  canCopy = false;

  @Output()
  copyClick = new EventEmitter();

  isMobile$!: Observable<boolean>;

  constructor(private readonly deviceService: DeviceService) {
  }

  ngOnInit(): void {
    this.isMobile$ = this.deviceService.deviceInfo$.pipe(
      map(x => x.isMobile as boolean),
      shareReplay(1)
    );
  }
}
