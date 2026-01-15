import {ChangeDetectionStrategy, Component, effect, inject, input, model} from '@angular/core';
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {NzRadioComponent, NzRadioGroupComponent} from "ng-zorro-antd/radio";
import {FormsModule} from "@angular/forms";
import {TranslocoDirective} from "@jsverse/transloco";
import {
  MarketOrderFormComponent
} from "../../../order-commands/components/order-forms/market-order-form/market-order-form.component";
import {
  LimitOrderFormComponent
} from "../../../order-commands/components/order-forms/limit-order-form/limit-order-form.component";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {AsyncPipe} from "@angular/common";
import {filter, shareReplay, switchMap} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {LimitOrderConfig, MarketOrderConfig} from "../../../../shared/models/orders/orders-config.model";
import {CommonParametersService} from "../../../order-commands/services/common-parameters.service";
import {ConfirmableOrderCommandsService} from "../../../order-commands/services/confirmable-order-commands.service";

@Component({
  selector: 'ats-submit-order-form',
  imports: [
    NzRadioGroupComponent,
    FormsModule,
    NzRadioComponent,
    TranslocoDirective,
    MarketOrderFormComponent,
    LimitOrderFormComponent,
    AsyncPipe
  ],
  templateUrl: './submit-order-form.component.html',
  styleUrl: './submit-order-form.component.less',
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitOrderFormComponent {
  readonly targetInstrument = input.required<InstrumentKey>();

  readonly price = input<number>();

  readonly formType = model<'limit' | 'market'>('limit');

  protected readonly limitOrderConfig: LimitOrderConfig = {
    isBracketsSupported: false,
    unsupportedFields: {
      reason: true,
      advanced: true
    }
  };

  protected readonly marketOrderConfig: MarketOrderConfig = {
    unsupportedFields: {
      advanced: true
    }
  };

  private readonly dashboardContextServiced = inject(DashboardContextService);

  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;

  private readonly commonParametersService = inject(CommonParametersService);

  private readonly instrumentsService = inject(InstrumentsService);

  protected readonly instrumentInfo$ = toObservable(this.targetInstrument).pipe(
    switchMap(i => this.instrumentsService.getInstrument(i)),
    filter(i => i != null),
    shareReplay(1)
  );

  constructor() {
    effect(() => {
      const price = this.price();
      if (price != null) {
        this.commonParametersService.setParameters({
          price
        });
      }
    });
  }
}
