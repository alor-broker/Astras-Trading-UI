import {
  BehaviorSubject,
  filter,
  Observable,
  of,
  Subject,
  Subscription,
  takeUntil
} from "rxjs";
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from "@angular/core";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { FormGroup } from "@angular/forms";
import { mapWith } from "../../../../shared/utils/observable-helper";

@Component({
  template: ''
})
export abstract class OrderFormBaseComponent<T, A = {}> implements OnInit, OnDestroy {
  form?: FormGroup;
  @Output()
  formValueChange = new EventEmitter<T | null>();
  public readonly instrument$ = new BehaviorSubject<Instrument | null>(null);
  protected destroy$: Subject<boolean> = new Subject<boolean>();
  protected formValueChangeSubscription?: Subscription;
  protected readonly initialValues$ = new BehaviorSubject<Partial<T> | null>(null);

  @Input()
  set instrument(value: Instrument) {
    this.instrument$.next(value);
  }

  @Input()
  set initialValues(value: Partial<T> | null) {
    this.initialValues$.next(value);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.formValueChangeSubscription?.unsubscribe();
    this.instrument$?.complete();
    this.initialValues$?.complete();
  }

  ngOnInit(): void {
    this.instrument$.pipe(
      filter((i): i is Instrument => !!i),
      mapWith(() => this.getFormInitAdditions(), (instrument, additions) => ({ instrument, additions })),
      takeUntil(this.destroy$)
    ).subscribe(({ instrument, additions }) => {
      this.initForm(instrument, additions);
      this.emitFormValue();
    });
  }

  protected abstract buildForm(instrument: Instrument, additions: A | null): FormGroup;

  protected getFormValue(): T | null {
    if (!this.form || !this.form.valid) {
      return null;
    }

    return this.form.value as T;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected onFormValueEmitted(value: T | null) {

  }

  protected getFormInitAdditions(): Observable<A | null> {
    return of(null);
  }

  protected onFormCreated() {
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected applyInitialValues(values: Partial<T> | null) {
  }

  private initForm(instrument: Instrument, additions: A | null) {
    this.formValueChangeSubscription?.unsubscribe();

    this.form = this.buildForm(instrument, additions);

    this.formValueChangeSubscription = this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.emitFormValue();
    });

    const initialValuesSubscription = this.initialValues$.subscribe(value => this.applyInitialValues(value));
    this.formValueChangeSubscription.add(initialValuesSubscription);

    this.onFormCreated();
  }

  private emitFormValue() {
    const value = this.getFormValue();
    this.formValueChange.emit(value);
    this.onFormValueEmitted(value);
  }
}
