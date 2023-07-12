import {
  BehaviorSubject,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  Subscription,
} from "rxjs";
import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { FormGroup } from "@angular/forms";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { ControlsOf } from '../../../../shared/models/form.model';
import { OrderFormValue, OrderFormUpdate } from '../../models/order-form.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  template: ''
})
export abstract class OrderFormBaseComponent<T extends {}, A = {}> implements OnInit, OnDestroy {
  form?: FormGroup<ControlsOf<T>>;
  @Output()
  formValueChange = new EventEmitter<OrderFormValue<T>>();
  public readonly isActivated$ = new BehaviorSubject<boolean>(false);
  public readonly instrument$ = new BehaviorSubject<Instrument | null>(null);
  protected formValueChangeSubscription?: Subscription;
  protected readonly valueUpdate$ = new BehaviorSubject<OrderFormUpdate<T>>(null);

  protected constructor(protected readonly destroyRef: DestroyRef) {
  }

  @Input()
  set instrument(value: Instrument) {
    this.instrument$.next(value);
  }

  @Input()
  set initialValues(value: Partial<T> | null) {
    this.valueUpdate$.next(value);
  }

  @Input()
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  ngOnDestroy(): void {
    this.formValueChangeSubscription?.unsubscribe();
    this.instrument$?.complete();
    this.valueUpdate$?.complete();
    this.isActivated$.complete();
  }

  ngOnInit(): void {
    this.instrument$.pipe(
      filter((i): i is Instrument => !!i),
      mapWith(() => this.getFormInitAdditions(), (instrument, additions) => ({ instrument, additions })),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ instrument, additions }) => {
      this.initForm(instrument, additions);
      this.emitFormValue();
    });
  }

  protected abstract buildForm(instrument: Instrument, additions: A | null): FormGroup<ControlsOf<T>>;

  protected getFormValue(): T | null {
    if (!this.form) {
      return null;
    }

    return this.form.value as T;
  }

  protected onFormValueEmitted?(value: T | null): void;

  protected getFormInitAdditions(): Observable<A | null> {
    return of(null);
  }

  protected onFormCreated() {
  }

  protected applyInitialValues?(values: OrderFormUpdate<T>): void;

  private initForm(instrument: Instrument, additions: A | null) {
    this.formValueChangeSubscription?.unsubscribe();

    this.form = this.buildForm(instrument, additions);

    this.formValueChangeSubscription = this.form.valueChanges.pipe(
      distinctUntilChanged((prev, curr) =>
        JSON.stringify(prev) === JSON.stringify(curr)
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.emitFormValue();
    });

    if (this.applyInitialValues) {
      const initialValuesSubscription = this.valueUpdate$.subscribe(value => this.applyInitialValues?.(value));
      this.formValueChangeSubscription.add(initialValuesSubscription);
    }

    this.onFormCreated();
  }

  private emitFormValue() {
    const value = this.getFormValue()!;
    this.formValueChange.emit({ value, isValid: this.form!.valid});
    this.onFormValueEmitted?.(value);
  }
}
