import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ArbitrageSpread } from "../../models/arbitrage-spread.model";
import { map } from "rxjs/operators";
import { Observable, shareReplay, Subscription } from "rxjs";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Store } from "@ngrx/store";
import { PortfoliosStreams } from "../../../../store/portfolios/portfolios.streams";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";

interface SpreadFormGroup {
  id: FormControl;
  firstLeg: FormGroup<SpreadLegFormGroup>;
  secondLeg: FormGroup<SpreadLegFormGroup>;
}

interface SpreadLegFormGroup {
  instrument: FormControl;
  quantity: FormControl;
  ratio: FormControl;
  portfolio: FormControl;
}

@Component({
  selector: 'ats-arbitrage-spread-manage',
  templateUrl: './arbitrage-spread-manage.component.html',
  styleUrls: ['./arbitrage-spread-manage.component.less']
})
export class ArbitrageSpreadManageComponent implements OnInit, OnDestroy {
  @Input() spread?: ArbitrageSpread | null;
  @Output() formChange = new EventEmitter();

  isPortfoliosEqual = isPortfoliosEqual;

  portfolios$?: Observable<PortfolioKey[]>;

  form = new FormGroup<SpreadFormGroup>({
    id: new FormControl(null),
    firstLeg: new FormGroup({
      instrument: new FormControl<Instrument | null>(null, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      quantity: new FormControl(null, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      ratio: new FormControl(1, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      portfolio: new FormControl(null, Validators.required)
    }),
    secondLeg: new FormGroup({
      instrument: new FormControl(null, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      quantity: new FormControl(null, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      ratio: new FormControl(1, [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]),
      portfolio: new FormControl(null, Validators.required)
    }),
  });

  formChangeSub?: Subscription;

  get firstLegFormGroup(): FormGroup<SpreadLegFormGroup> {
    return this.form.get('firstLeg') as FormGroup<SpreadLegFormGroup>;
  }

  get secondLegFormGroup(): FormGroup<SpreadLegFormGroup> {
    return this.form.get('secondLeg') as FormGroup<SpreadLegFormGroup>;
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

    if (this.spread) {
      this.form.get('firstLeg')?.patchValue(this.spread.firstLeg);
      this.form.get('secondLeg')?.patchValue(this.spread.secondLeg);
      this.form.get('id')?.patchValue(this.spread.id);
    }

    this.formChangeSub = this.form.valueChanges.subscribe(value => {
      this.formChange.emit({
        value,
        isValid: this.form.valid
      });
    });
  }

  ngOnDestroy() {
    this.formChangeSub?.unsubscribe();
  }
}
