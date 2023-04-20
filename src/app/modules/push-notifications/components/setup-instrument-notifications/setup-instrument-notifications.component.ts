import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, NEVER, Observable, of, switchMap, take, takeUntil} from "rxjs";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {PushNotificationsService} from "../../services/push-notifications.service";
import {PriceSparkSubscription, PushSubscriptionType} from "../../models/push-notifications.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {LessMore} from "../../../../shared/models/enums/less-more.model";
import {FormControl, UntypedFormGroup, Validators} from "@angular/forms";
import {inputNumberValidation} from "../../../../shared/utils/validation-options";
import {filter} from "rxjs/operators";
import {Destroyable} from "../../../../shared/utils/destroyable";

@Component({
  selector: 'ats-setup-instrument-notifications',
  templateUrl: './setup-instrument-notifications.component.html',
  styleUrls: ['./setup-instrument-notifications.component.less']
})
export class SetupInstrumentNotificationsComponent implements OnInit, OnDestroy {
  currentInstrumentSubscriptions$!: Observable<PriceSparkSubscription[]>;
  newPriceChangeSubscriptionForm!: UntypedFormGroup;
  readonly isLoading$ = new BehaviorSubject(false);
  private readonly destroyable = new Destroyable();
  private readonly instrumentKey$ = new BehaviorSubject<InstrumentKey | null>(null);
  private readonly refresh$ = new BehaviorSubject(null);

  constructor(
    private readonly pushNotificationsService: PushNotificationsService
  ) {
  }

  @Input()
  set instrumentKey(value: InstrumentKey | null) {
    this.instrumentKey$.next(value);
  }

  @Input()
  set active(value: boolean) {
    if (value) {
      this.refresh$.next(null);
    }
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
    this.instrumentKey$.complete();
    this.refresh$.complete();
  }

  ngOnInit(): void {
    this.initCurrentInstrumentSubscriptions();
    this.initNewPriceChangeSubscriptionForm();

    this.pushNotificationsService.subscriptionsUpdated$.pipe(
      filter(x => x == null || x === PushSubscriptionType.PriceSpark),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(() => {
      this.refresh$.next(null);
    });
  }

  cancelSubscription(id: string) {
    this.isLoading$.next(true);
    this.pushNotificationsService.cancelSubscription(id).pipe(
      take(1)
    ).subscribe(() =>
      this.refresh$.next(null));
  }

  addSubscription(): void {
    this.instrumentKey$.pipe(
      take(1),
      filter((x): x is InstrumentKey => !!x),
      switchMap(instrumentKey => {
        if (!this.newPriceChangeSubscriptionForm.valid) {
          return NEVER;
        }

        const subscriptionParams = this.newPriceChangeSubscriptionForm.value;

        this.isLoading$.next(true);
        return this.pushNotificationsService.subscribeToPriceChange({
          instrument: instrumentKey.symbol,
          exchange: instrumentKey.exchange,
          board: instrumentKey.instrumentGroup ?? '',
          price: subscriptionParams.price,
          priceCondition: subscriptionParams.priceCondition
        });
      }),
      take(1)
    ).subscribe(() => {
      this.refresh$.next(null);
    });
  }

  getAvailablePriceConditions(currentSubscriptions: PriceSparkSubscription[]): string[] {
    return Object.values(LessMore)
      .filter(cond => currentSubscriptions.find(s => s.priceCondition === cond) == null);
  }

  private initCurrentInstrumentSubscriptions() {
    this.currentInstrumentSubscriptions$ =
      this.refresh$.pipe(
        switchMap(() => this.instrumentKey$),
        mapWith(instrumentKey => {
            if (!instrumentKey) {
              return of([]);
            }

            this.isLoading$.next(true);
            return this.pushNotificationsService.getCurrentSubscriptions();
          },
          (instrumentKey, allSubscriptions) => {
            this.isLoading$.next(false);

            return (allSubscriptions ?? [])
              .filter(x => x.subscriptionType === PushSubscriptionType.PriceSpark)
              .map(x => x as PriceSparkSubscription)
              .filter(x => x.instrument === instrumentKey?.symbol
                && x.exchange === instrumentKey.exchange
                && (!instrumentKey.instrumentGroup || instrumentKey.instrumentGroup === x.board));
          }
        )
      );
  }

  private initNewPriceChangeSubscriptionForm() {
    this.newPriceChangeSubscriptionForm = new UntypedFormGroup({
      price: new FormControl(
        null,
        [
          Validators.required,
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)]
      ),
      priceCondition: new FormControl(
        null,
        Validators.required
      )
    });

    this.refresh$.pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(() => {
      this.newPriceChangeSubscriptionForm?.reset();
    });
  }
}
