import { Component, OnInit } from '@angular/core';
import { Observable, of, take } from "rxjs";
import { ArbitrageSpreadService } from "../../services/arbitrage-spread.service";
import { ArbitrageSpread } from "../../models/arbitrage-spread.model";

@Component({
    selector: 'ats-arbitrage-spread-modal-widget',
    templateUrl: './arbitrage-spread-modal-widget.component.html',
    styleUrls: ['./arbitrage-spread-modal-widget.component.less'],
    standalone: false
})
export class ArbitrageSpreadModalWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  spreadInfo$: Observable<ArbitrageSpread | null> = of(null);
  formData: { value: ArbitrageSpread, isValid: boolean } | null = null;

  constructor(
    private readonly service: ArbitrageSpreadService
  ) {
  }

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
