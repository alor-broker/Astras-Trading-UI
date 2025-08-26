import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import { Idea } from "../../models/ideas-typings.model";
import { TranslocoDirective } from "@jsverse/transloco";
import {
  asyncScheduler,
  BehaviorSubject,
  filter,
  shareReplay,
  subscribeOn,
  switchMap
} from "rxjs";
import { AsyncPipe } from "@angular/common";
import { CompactHeaderComponent } from "../../../order-commands/components/compact-header/compact-header.component";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { OrderCommandsModule } from "../../../order-commands/order-commands.module";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { LimitOrderConfig } from "../../../../shared/models/orders/orders-config.model";
import {
  CommonParameters,
  CommonParametersService
} from "../../../order-commands/services/common-parameters.service";
import { ConfirmableOrderCommandsService } from "../../../order-commands/services/confirmable-order-commands.service";
import { LimitOrderFormComponent } from "../../../order-commands/components/order-forms/limit-order-form/limit-order-form.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-submit-order-for-idea',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    CompactHeaderComponent,
    OrderCommandsModule
  ],
  templateUrl: './submit-order-for-idea.component.html',
  styleUrl: './submit-order-for-idea.component.less',
  providers: [
    CommonParametersService,
    ConfirmableOrderCommandsService
  ]
})
export class SubmitOrderForIdeaComponent implements OnInit {
  protected readonly targetIdea$ = new BehaviorSubject<Idea | null>(null);

  protected readonly selectedPortfolio$ = this.dashboardContextServiced.selectedPortfolio$;

  protected readonly targetInstrument$ = this.targetIdea$.pipe(
    filter(i => i != null),
    switchMap(i => this.instrumentsService.getInstrument(i.instrumentKey)),
    filter(i => i != null),
    shareReplay(1)
  );

  protected readonly limitOrderConfig: LimitOrderConfig = {
    isBracketsSupported: false,
    unsupportedFields: {
      reason: true,
      advanced: true
    }
  };

  @ViewChild('limitOrderForm')
  protected limitOrderForm?: LimitOrderFormComponent;

  constructor(
    private readonly dashboardContextServiced: DashboardContextService,
    private readonly instrumentsService: InstrumentsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input({required: true})
  set idea(value: Idea) {
    this.targetIdea$.next(value);
  }

  ngOnInit(): void {
    this.targetInstrument$.pipe(
      takeUntilDestroyed(this.destroyRef),
      subscribeOn(asyncScheduler)
    ).subscribe(() => this.limitOrderForm?.updateEvaluation());
  }

  setCommonParameters(params: Partial<CommonParameters>): void {
    this.commonParametersService.setParameters(params);
  }
}
