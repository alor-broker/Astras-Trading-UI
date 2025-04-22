import { Component, DestroyRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  fromEvent,
  NEVER,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from "rxjs";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { PushNotificationsService } from "../../services/push-notifications.service";
import { PriceSparkSubscription, PushSubscriptionType } from "../../models/push-notifications.model";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { LessMore } from "../../../../shared/models/enums/less-more.model";
import {
  FormBuilder,
  Validators
} from "@angular/forms";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import {
  filter,
  map
} from "rxjs/operators";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonParametersService } from "../../../order-commands/services/common-parameters.service";
import { QuotesService } from "../../../../shared/services/quotes.service";

@Component({
    selector: 'ats-setup-instrument-notifications',
    templateUrl: './setup-instrument-notifications.component.html',
    styleUrls: ['./setup-instrument-notifications.component.less'],
    standalone: false
})
export class SetupInstrumentNotificationsComponent implements OnInit, OnDestroy {
  isNotificationsAllowed$!: Observable<boolean>;
  currentInstrumentSubscriptions$!: Observable<PriceSparkSubscription[]>;

  readonly newPriceChangeSubscriptionForm = this.formBuilder.group({
    price: this.formBuilder.nonNullable.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]
    ),
    priceCondition: this.formBuilder.nonNullable.control<LessMore | null>(null, Validators.required)
  });

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
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input()
  set instrumentKey(value: InstrumentKey | null) {
    this.instrumentKey$.next(value);
  }

  @Input()
  initialValues: {
    price?: number;
  } | null = null;

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

    combineLatest({
      initialValues: of(this.initialValues),
      commonParameters: this.commonParametersService.parameters$,
      instrumentKey: this.instrumentKey$
    }).pipe(
      filter(x => x.instrumentKey != null),
      mapWith(
        x => this.quoteService.getLastPrice(x.instrumentKey!),
        (source, lastPrice) => (
          {
            selectedPrice: source.commonParameters.price ?? source.initialValues?.price,
            lastPrice: lastPrice ?? 0
          }
          )
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ selectedPrice, lastPrice }) => {
        this.newPriceChangeSubscriptionForm.controls.price.setValue(selectedPrice ?? 0);
        this.newPriceChangeSubscriptionForm.controls.priceCondition.setValue((selectedPrice != null && selectedPrice > lastPrice)
          ? LessMore.More
          : LessMore.Less
        );
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
        if (!this.newPriceChangeSubscriptionForm.valid) {
          return NEVER;
        }

        const subscriptionParams = this.newPriceChangeSubscriptionForm.value;

        this.isLoading$.next(true);
        return this.pushNotificationsService.subscribeToPriceChange({
          instrument: instrumentKey.symbol,
          exchange: instrumentKey.exchange,
          board: instrumentKey.instrumentGroup ?? '',
          price: subscriptionParams.price!,
          priceCondition: subscriptionParams.priceCondition!
        });
      }),
      take(1)
    ).subscribe(() => {
      this.newPriceChangeSubscriptionForm.reset();
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

  private initNotificationsUpdateSubscription(): void {
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.refresh$.next(null));
  }
}
