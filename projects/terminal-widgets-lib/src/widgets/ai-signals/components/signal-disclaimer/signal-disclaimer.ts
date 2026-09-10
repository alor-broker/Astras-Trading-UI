import {
  ChangeDetectionStrategy,
  Component,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzModalComponent} from 'ng-zorro-antd/modal';

@Component({
  selector: 'ats-signal-disclaimer',
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzModalComponent,
    NzButtonComponent
  ],
  templateUrl: './signal-disclaimer.html',
  styleUrl: './signal-disclaimer.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalDisclaimer {
  protected readonly isDialogVisible = signal(false);

  protected openDialog(): void {
    this.isDialogVisible.set(true);
  }

  protected closeDialog(): void {
    this.isDialogVisible.set(false);
  }
}
