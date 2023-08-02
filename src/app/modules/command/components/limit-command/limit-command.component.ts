import { Component, DestroyRef, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { CommandParams, TimeInForce } from 'src/app/shared/models/commands/command-params.model';
import { CommandsService } from '../../services/commands.service';
import { LimitCommand } from '../../models/limit-command.model';
import { LimitFormData } from '../../models/limit-form-data.model';
import { CommandContextModel } from '../../models/command-context.model';
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { ControlsOf } from '../../../../shared/models/form.model';
import { AtsValidators } from "../../../../shared/utils/form-validators";
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';
import { Side } from "../../../../shared/models/enums/side.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-limit-command',
  templateUrl: './limit-command.component.html',
  styleUrls: ['./limit-command.component.less']
})
export class LimitCommandComponent implements OnInit, OnDestroy {
  evaluationSubject = new BehaviorSubject<EvaluationBaseProperties | null>(null);
  evaluation$?: Observable<EvaluationBaseProperties | null>;
  form!: FormGroup<ControlsOf<LimitFormData>>;
  commandContext$ = new BehaviorSubject<CommandContextModel<CommandParams> | null>(null);
  timeInForceEnum = TimeInForce;

  constructor(
    private readonly service: CommandsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input({required: true})
  set commandContext(value: CommandContextModel<CommandParams>) {
    this.commandContext$.next(value);
  }

  @Input()
  set price(value: {price: number} | null){
    if(value?.price != null) {
      this.form.get('price')?.setValue(value.price);
    }
  }

  @Input()
  set quantity(value: {quantity: number} | null){
    if(value?.quantity != null) {
      this.quantitySelect(value.quantity);
    }
  }

  ngOnInit() {
    this.commandContext$.pipe(
      filter((x): x is CommandContextModel<CommandParams> => !!x),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(context => {
      this.initCommandForm(context);
    });
  }

  ngOnDestroy(): void {
    this.commandContext$.complete();
    this.evaluationSubject.complete();
  }

  quantitySelect(qty: number) {
    this.form.get('quantity')?.setValue(qty);
  }

  private setLimitCommand(commandContext: CommandContextModel<CommandParams>): void {
    if (!this.form.valid) {
      this.service.setLimitCommand(null);
      return;
    }

    const formValue = this.form.value as LimitFormData;

    let additionalData = {} as any;

    if (formValue.isIceberg) {
      additionalData.icebergFixed = Number(formValue.icebergFixed ?? 0);
      if (formValue.icebergVariance) {
        additionalData.icebergVariance = Number(formValue.icebergVariance);
      }
    }

    if (formValue.timeInForce) {
      additionalData.timeInForce = formValue.timeInForce;
    }

    if (formValue.bottomOrderPrice) {
      additionalData.bottomOrderPrice = formValue.bottomOrderPrice;
      additionalData.bottomOrderSide = formValue.bottomOrderSide;
    }

    if (formValue.topOrderPrice) {
      additionalData.topOrderPrice = formValue.topOrderPrice;
      additionalData.topOrderSide = formValue.topOrderSide;
    }

    if (commandContext.commandParameters && commandContext.commandParameters.user) {
      const newCommand: LimitCommand = {
        quantity: Number(formValue.quantity),
        price: Number(formValue.price),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: formValue.instrumentGroup ?? commandContext.commandParameters.instrument.instrumentGroup
        },
        user: commandContext.commandParameters.user,
        ...additionalData
      };

      this.updateEvaluation(newCommand, commandContext);
      this.service.setLimitCommand(newCommand);
    }
    else {
      throw new Error('Empty command');
    }
  }

  private buildForm(commandContext: CommandContextModel<CommandParams>): FormGroup<ControlsOf<LimitFormData>> {
    return new FormGroup<ControlsOf<LimitFormData>>({
        quantity: new FormControl(
          commandContext.commandParameters.quantity ?? 1,
          [
            Validators.required,
            Validators.min(inputNumberValidation.min),
            Validators.max(inputNumberValidation.max),
          ]
        ),
        price: new FormControl(
          commandContext.commandParameters.price ?? null,
          [
            Validators.required,
            Validators.min(inputNumberValidation.negativeMin),
            Validators.max(inputNumberValidation.max),
            AtsValidators.priceStepMultiplicity(commandContext.instrument.minstep || 0)
          ]
        ),
        instrumentGroup: new FormControl(commandContext.commandParameters.instrument.instrumentGroup),
        timeInForce: new FormControl(null),
        isIceberg: new FormControl(false),
        icebergFixed: new FormControl(null, Validators.min(inputNumberValidation.min)),
        icebergVariance: new FormControl(null, Validators.min(inputNumberValidation.min)),
        topOrderPrice: new FormControl(commandContext.commandParameters.topOrderPrice || null, [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]),
        topOrderSide: new FormControl(commandContext.commandParameters.topOrderSide || Side.Buy),
        bottomOrderPrice: new FormControl(commandContext.commandParameters.bottomOrderPrice || null, [
          Validators.min(inputNumberValidation.negativeMin),
          Validators.max(inputNumberValidation.max)
        ]),
        bottomOrderSide: new FormControl(commandContext.commandParameters.bottomOrderSide || Side.Buy)
      },
      AtsValidators.notBiggerThan('icebergFixed', 'quantity', () => !!this.form?.get('isIceberg')?.value)
    );
  }

  private updateEvaluation(command: LimitCommand, commandContext: CommandContextModel<CommandParams>) {
    const evaluation: EvaluationBaseProperties = {
      price: command.price,
      lotQuantity: command.quantity,
      instrument: {
        ...command.instrument
      },
      instrumentCurrency: commandContext.instrument?.currency
    };

    this.evaluationSubject.next(evaluation);
  }

  private initCommandForm(commandContext: CommandContextModel<CommandParams>) {
    this.form = this.buildForm(commandContext);
    this.setLimitCommand(commandContext);

    this.evaluation$ = this.evaluationSubject.asObservable()
      .pipe(
        distinctUntilChanged((prev, curr) =>
          JSON.stringify(prev) === JSON.stringify(curr)
        )
      );

    this.form.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged((prev, curr) =>
        prev?.price == curr?.price
        && prev?.quantity == curr?.quantity
        && prev?.instrumentGroup == curr?.instrumentGroup
        && prev?.timeInForce == curr?.timeInForce
        && prev?.isIceberg == curr?.isIceberg
        && prev?.icebergFixed == curr?.icebergFixed
        && prev?.icebergVariance == curr?.icebergVariance
        && prev?.topOrderPrice == curr?.topOrderPrice
        && prev?.topOrderSide == curr?.topOrderSide
        && prev?.bottomOrderPrice == curr?.bottomOrderPrice
        && prev?.bottomOrderSide == curr?.bottomOrderSide
      )
    ).subscribe(() => {
      this.setLimitCommand(commandContext);
    });
  }
}
