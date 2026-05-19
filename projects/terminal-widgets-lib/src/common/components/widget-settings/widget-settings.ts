import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {AsyncPipe} from '@angular/common';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'ats-widget-settings',
  imports: [
    AsyncPipe,
    NzTooltipDirective,
    NzIconDirective,
    NzButtonComponent,
    TranslocoDirective
  ],
  templateUrl: './widget-settings.html',
  styleUrl: './widget-settings.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSettings implements OnInit {
  readonly canSave = input.required<boolean>();

  readonly saveClick = output();

  readonly showCopy = input(false);

  readonly canCopy = input.required<boolean>();

  readonly copyClick = output();

  isMobile$!: Observable<boolean>;

  private readonly deviceService = inject(DeviceService);

  ngOnInit(): void {
    this.isMobile$ = this.deviceService.deviceInfo$.pipe(
      map(x => x.isMobile as boolean),
      shareReplay(1)
    );
  }
}
