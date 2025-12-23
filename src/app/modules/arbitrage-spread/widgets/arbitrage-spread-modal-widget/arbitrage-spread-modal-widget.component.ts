import { Component, OnInit, inject } from '@angular/core';
import {Observable, of, take} from "rxjs";
import {ArbitrageSpreadService} from "../../services/arbitrage-spread.service";
import {ArbitrageSpread} from "../../models/arbitrage-spread.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from 'ng-zorro-antd/modal';
import {
  ArbitrageSpreadManageComponent
} from '../../components/arbitrage-spread-manage/arbitrage-spread-manage.component';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzWaveDirective} from 'ng-zorro-antd/core/wave';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-arbitrage-spread-modal-widget',
  templateUrl: './arbitrage-spread-modal-widget.component.html',
  styleUrls: ['./arbitrage-spread-modal-widget.component.less'],
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    ArbitrageSpreadManageComponent,
    NzModalFooterDirective,
    NzButtonComponent,
    NzWaveDirective,
    AsyncPipe
  ]
})
export class ArbitrageSpreadModalWidgetComponent implements OnInit {
  private readonly service = inject(ArbitrageSpreadService);

  isVisible$: Observable<boolean> = of(false);
  spreadInfo$: Observable<ArbitrageSpread | null> = of(null);
  formData: { value: ArbitrageSpread, isValid: boolean } | null = null;

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
