import { Component, OnInit, input, output, inject } from '@angular/core';
import { DeviceService } from "../../services/device.service";
import {
  Observable,
  shareReplay
} from "rxjs";
import { map } from "rxjs/operators";
import { TranslocoDirective } from "@jsverse/transloco";
import { AsyncPipe } from "@angular/common";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { NzIconDirective } from "ng-zorro-antd/icon";

@Component({
    selector: 'ats-widget-settings',
    templateUrl: './widget-settings.component.html',
    imports: [
    TranslocoDirective,
    NzTooltipDirective,
    NzButtonComponent,
    NzIconDirective,
    AsyncPipe
],
    styleUrls: ['./widget-settings.component.less']
})
export class WidgetSettingsComponent implements OnInit {
  private readonly deviceService = inject(DeviceService);

  readonly canSave = input.required<boolean>();

  readonly saveClick = output();

  readonly showCopy = input(false);

  readonly canCopy = input.required<boolean>();

  readonly copyClick = output();

  isMobile$!: Observable<boolean>;

  ngOnInit(): void {
    this.isMobile$ = this.deviceService.deviceInfo$.pipe(
      map(x => x.isMobile as boolean),
      shareReplay(1)
    );
  }
}
