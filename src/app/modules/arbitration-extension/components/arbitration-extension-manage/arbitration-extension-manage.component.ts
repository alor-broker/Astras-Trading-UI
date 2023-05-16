import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { ArbitrationExtension } from "../../models/arbitration-extension.model";
import { map } from "rxjs/operators";
import { Observable, shareReplay } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { PortfoliosStreams } from "../../../../store/portfolios/portfolios.streams";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";

@Component({
  selector: 'ats-arbitration-extension-manage',
  templateUrl: './arbitration-extension-manage.component.html',
  styleUrls: ['./arbitration-extension-manage.component.less']
})
export class ArbitrationExtensionManageComponent implements OnInit {
  @Input() extension?: ArbitrationExtension | null;
  @Output() formChange = new EventEmitter();

  isPortfoliosEqual = isPortfoliosEqual;

  portfolios$?: Observable<PortfolioKey[]>;

  form = new UntypedFormGroup({
    id: new UntypedFormControl(null),
    firstLeg: new UntypedFormGroup({
      instrument: new UntypedFormControl(null, Validators.required),
      quantity: new UntypedFormControl(null, Validators.required),
      ratio: new UntypedFormControl(1),
      portfolio: new UntypedFormControl(null, Validators.required)
    }),
    secondLeg: new UntypedFormGroup({
      instrument: new UntypedFormControl(null, Validators.required),
      quantity: new UntypedFormControl(null, Validators.required),
      ratio: new UntypedFormControl(1),
      portfolio: new UntypedFormControl(null, Validators.required)
    }),
  });

  get firstLegFormGroup(): UntypedFormGroup {
    return this.form.get('firstLeg') as UntypedFormGroup;
  }

  get secondLegFormGroup(): UntypedFormGroup {
    return this.form.get('secondLeg') as UntypedFormGroup;
  }

  constructor(
    private readonly store: Store
  ) {
  }

  ngOnInit() {
    this.portfolios$ = PortfoliosStreams.getAllPortfolios(this.store)
      .pipe(
        map(portfolios => portfolios.map(p => ({ portfolio: p.portfolio, exchange: p.exchange }))),
        shareReplay(1)
      );

    if (this.extension) {
      this.form.get('firstLeg')?.setValue(this.extension.firstLeg);
      this.form.get('secondLeg')?.setValue(this.extension.secondLeg);
      this.form.get('id')?.setValue(this.extension.id);
    }

    this.form.valueChanges.subscribe(value => {
      this.formChange.emit({
        value,
        isValid: this.form.valid
      });
    });
  }
}
