import { Component, DestroyRef, input, OnDestroy, OnInit, inject } from '@angular/core';
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
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {PushNotificationsService} from "../../services/push-notifications.service";
import {PriceSparkSubscription, PushSubscriptionType} from "../../models/push-notifications.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {LessMore} from "../../../../shared/models/enums/less-more.model";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {inputNumberValidation} from "../../../../shared/utils/validation-options";
import {filter, map} from "rxjs/operators";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {CommonParametersService} from "../../../order-commands/services/common-parameters.service";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzRadioComponent, NzRadioGroupComponent} from 'ng-zorro-antd/radio';
import {InputNumberComponent} from '../../../../shared/components/input-number/input-number.component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-setup-instrument-notifications',
  templateUrl: './setup-instrument-notifications.component.html',
  styleUrls: ['./setup-instrument-notifications.component.less'],
  imports: [
    TranslocoDirective,
    NzSpinComponent,
    NzButtonComponent,
    NzIconDirective,
    NzDividerComponent,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzRadioGroupComponent,
    NzRadioComponent,
    InputNumberComponent,
    NzTypographyComponent,
    AsyncPipe
  ]
})
export class SetupInstrumentNotificationsComponent implements OnInit, OnDestroy {
  private readonly pushNotificationsService = inject(PushNotificationsService);
  private readonly commonParametersService = inject(CommonParametersService);
  private readonly quoteService = inject(QuotesService);
  private readonly instrumentService = inject(InstrumentsService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

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
  readonly refresh$ = new BehaviorSubject(null);

  readonly lessMore = LessMore;
  instrument$!: Observable<Instrument>;
  readonly initialValues = input<{
    price?: number;
  } | null>(null);

  readonly instrumentKey = input<InstrumentKey | null>(null);

  readonly active = input<boolean>(false);

  private readonly instrumentKeyChanges$ = toObservable(this.instrumentKey).pipe(shareReplay(1));

  private readonly activeChanges$ = toObservable(this.active);

  ngOnDestroy(): void {
    this.isLoading$.complete();
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

    this.activeChanges$.pipe(
      filter(x => x),
      takeUntilDestroyed(this.destroyRef)
    )
      .subscribe(() => this.refresh$.next(null));

    combineLatest({
      initialValues: of(this.initialValues()),
      commonParameters: this.commonParametersService.parameters$,
      instrumentKey: this.instrumentKeyChanges$
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
    ).subscribe(({selectedPrice, lastPrice}) => {
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
    this.instrumentKeyChanges$.pipe(
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
        switchMap(() => this.instrumentKeyChanges$),
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
    this.instrument$ = this.instrumentKeyChanges$.pipe(
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
