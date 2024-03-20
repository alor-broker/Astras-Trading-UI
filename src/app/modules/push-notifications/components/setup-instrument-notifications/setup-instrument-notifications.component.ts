import { Component, DestroyRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  delay,
  fromEvent,
  NEVER,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { PushNotificationsService } from "../../services/push-notifications.service";
import { PriceSparkSubscription, PushSubscriptionType } from "../../models/push-notifications.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { LessMore } from "../../../../shared/models/enums/less-more.model";
import { FormControl, UntypedFormGroup, Validators } from "@angular/forms";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { filter, map } from "rxjs/operators";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonParametersService } from "../../../order-commands/services/common-parameters.service";
import { QuotesService } from "../../../../shared/services/quotes.service";

@Component({
  selector: 'ats-setup-instrument-notifications',
  templateUrl: './setup-instrument-notifications.component.html',
  styleUrls: ['./setup-instrument-notifications.component.less']
})
export class SetupInstrumentNotificationsComponent implements OnInit, OnDestroy {
  isNotificationsAllowed$!: Observable<boolean>;
  currentInstrumentSubscriptions$!: Observable<PriceSparkSubscription[]>;
  newPriceChangeSubscriptionForm?: UntypedFormGroup;
  readonly isLoading$ = new BehaviorSubject(false);
  readonly lessMore = LessMore;
  instrument$!: Observable<Instrument>;
  private readonly instrumentKey$ = new BehaviorSubject<InstrumentKey | null>(null);
  private readonly refresh$ = new BehaviorSubject(null);

  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly commonParametersService: CommonParametersService,
    private readonly quoteService: QuotesService,
    private readonly instrumentService: InstrumentsService,
    private readonly destroyRef: DestroyRef
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
    this.instrumentKey$.complete();
    this.refresh$.complete();
  }

  ngOnInit(): void {
    this.initInstrument();
    this.initNotificationStatusCheck();
    this.initCurrentInstrumentSubscriptions();
    this.initNewPriceChangeSubscriptionForm();
    this.initNotificationsUpdateSubscription();

    this.pushNotificationsService.subscriptionsUpdated$.pipe(
      filter(x => x == null || x === PushSubscriptionType.PriceSpark),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.refresh$.next(null);
    });

    this.pushNotificationsService.getMessages()
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refresh$.next(null));

    this.commonParametersService.parameters$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        withLatestFrom(this.instrumentKey$),
        filter(([v, i]) => v?.price != null && i != null),
        mapWith(
          ([, i]) => this.quoteService.getLastPrice(i!),
          ([parameters], lastPrice) => ({ selectedPrice: parameters.price!, lastPrice: lastPrice ?? 0 })
        )
      )
      .subscribe(({ selectedPrice, lastPrice }) => {
        this.newPriceChangeSubscriptionForm!.controls.price.setValue(selectedPrice);
        this.newPriceChangeSubscriptionForm!.controls.priceCondition.setValue(selectedPrice > lastPrice ? LessMore.More : LessMore.Less);
      });
  }

  cancelSubscription(id: string): void {
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
      switchMap((instrumentKey: InstrumentKey) => {
        if (!(this.newPriceChangeSubscriptionForm?.valid ?? false)) {
          return NEVER;
        }

        const subscriptionParams = this.newPriceChangeSubscriptionForm!.value as { price: string, priceCondition: LessMore };

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
      this.newPriceChangeSubscriptionForm?.reset();
      this.refresh$.next(null);
    });
  }

  private initNotificationStatusCheck(): void {
    this.isNotificationsAllowed$ = this.pushNotificationsService.getBrowserNotificationsStatus().pipe(
      map(s => s === "granted"),
      shareReplay(1)
    );
  }

  private initCurrentInstrumentSubscriptions(): void {
    this.currentInstrumentSubscriptions$ =
      this.isNotificationsAllowed$.pipe(
        filter(x => x),
        delay(0), // Needs to prevent ExpressionChangedAfterItHasBeenChecked error
        switchMap(() => this.refresh$),
        switchMap(() => this.instrumentKey$),
        tap(() => this.isLoading$.next(true)),
        mapWith(instrumentKey => {
            if (!instrumentKey) {
              return of([]);
            }

            return this.pushNotificationsService.getCurrentSubscriptions();
          },
          (instrumentKey, allSubscriptions) => {
            return (allSubscriptions ?? [])
              .filter(x => x.subscriptionType === PushSubscriptionType.PriceSpark)
              .map(x => x as PriceSparkSubscription)
              .filter(x => x.instrument === instrumentKey?.symbol
                && x.exchange === instrumentKey.exchange
                && (!(instrumentKey.instrumentGroup ?? '') || instrumentKey.instrumentGroup === x.board))
              .sort((a, b) => this.sortSubscriptions(a, b));
          }
        ),
        tap(() => this.isLoading$.next(false))
      );
  }

  private initInstrument(): void {
    this.instrument$ = this.instrumentKey$.pipe(
      filter((i): i is InstrumentKey => !!i),
      switchMap(instrumentKey => this.instrumentService.getInstrument(instrumentKey)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
    );
  }

  private sortSubscriptions(a: PriceSparkSubscription, b: PriceSparkSubscription): number {
    const priceCompare = a.price - b.price;
    if (priceCompare === 0) {
      const aCond = a.priceCondition === LessMore.Less ? 1 : 10;
      const bCond = b.priceCondition === LessMore.Less ? 1 : 10;

      return aCond - bCond;
    }

    return priceCompare;
  }

  private initNewPriceChangeSubscriptionForm(): void {
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
  }

  private initNotificationsUpdateSubscription(): void {
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refresh$.next(null));
  }
}
