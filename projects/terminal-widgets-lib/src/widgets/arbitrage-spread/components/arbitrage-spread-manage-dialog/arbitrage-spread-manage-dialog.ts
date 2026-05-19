import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {ArbitrageSpreadService} from '@terminal-widgets-lib/widgets/arbitrage-spread/services/arbitrage-spread.service';
import {
  Observable,
  of,
  take
} from 'rxjs';
import {ArbitrageSpread} from '@terminal-widgets-lib/widgets/arbitrage-spread/types/arbitrage-spread.types';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {ArbitrageSpreadManage} from '@terminal-widgets-lib/widgets/arbitrage-spread/components/arbitrage-spread-manage/arbitrage-spread-manage';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-arbitrage-spread-manage-dialog',
  imports: [
    NzModalModule,
    TranslocoDirective,
    AsyncPipe,
    ArbitrageSpreadManage,
    NzButtonComponent,
  ],
  templateUrl: './arbitrage-spread-manage-dialog.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArbitrageSpreadManageDialog {
  isVisible$: Observable<boolean> = of(false);

  spreadInfo$: Observable<ArbitrageSpread | null> = of(null);

  formData: { value: ArbitrageSpread, isValid: boolean } | null = null;

  private readonly service = inject(ArbitrageSpreadService);

  ngOnInit(): void {
    this.isVisible$ = this.service.shouldShowSpreadModal$;
    this.spreadInfo$ = this.service.spreadParams$;
  }

  handleCancel(): void {
    this.formData = null;
    this.service.closeSpreadModal();
  }

  formChange(data: { value: ArbitrageSpread, isValid: boolean }): void {
    this.formData = data;
  }

  addOrEdit(): void {
    this.spreadInfo$
      .pipe(
        take(1)
      )
      .subscribe(ext => {
        if (ext) {
          this.service.editSpread(this.formData!.value);
        } else {
          this.service.addSpread(this.formData!.value);
        }

        this.handleCancel();
      });
  }
}
