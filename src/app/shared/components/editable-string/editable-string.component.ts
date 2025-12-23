import { Component, DestroyRef, ElementRef, input, OnDestroy, OnInit, output, viewChildren, inject } from '@angular/core';
import {BehaviorSubject, filter, take,} from 'rxjs';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {map} from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {AsyncPipe} from "@angular/common";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent} from "ng-zorro-antd/form";
import {NzInputDirective, NzInputGroupComponent} from "ng-zorro-antd/input";

@Component({
  selector: 'ats-editable-string',
  templateUrl: './editable-string.component.html',
  styleUrls: ['./editable-string.component.less'],
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzIconDirective,
    ReactiveFormsModule,
    NzButtonComponent,
    NzFormDirective,
    NzFormItemComponent,
    NzInputGroupComponent,
    NzFormControlComponent,
    NzInputDirective
  ]
})
export class EditableStringComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly editInput = viewChildren<ElementRef<HTMLInputElement>>('editInput');
  readonly content = input.required<string | null>();
  readonly lengthRestrictions = input<{
    minLength: number;
    maxLength: number;
  } | null>(null);

  readonly inputClass = input('');

  readonly contentChanged = output<string>();

  isEditMode$ = new BehaviorSubject(false);

  editForm = this.formBuilder.group({
    content: this.formBuilder.nonNullable.control('')
  });

  private readonly editInputChanges$ = toObservable(this.editInput);

  ngOnInit(): void {
    this.isEditMode$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(x => x)
    ).subscribe(() => {
      this.initForm();
    });
  }

  setEditMode(value: boolean): void {
    this.isEditMode$.next(value);
  }

  ngOnDestroy(): void {
    this.isEditMode$.complete();
  }

  checkInputCompleteOrCancel(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.emitValueIfValid();
      event.stopPropagation();
      event.preventDefault();
    }

    if (event.key === "Esc") {
      this.setEditMode(false);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  emitValueIfValid(): void {
    if (this.editForm.valid ?? false) {
      this.contentChanged.emit(this.editForm!.value.content ?? '');
    }

    this.setEditMode(false);
  }

  private initForm(): void {
    this.editForm.reset();
    this.editForm.controls.content.clearValidators();

    const lengthRestrictions = this.lengthRestrictions();
    if (lengthRestrictions) {
      this.editForm.controls.content.addValidators([
        Validators.required,
        Validators.minLength(lengthRestrictions.minLength),
        Validators.maxLength(lengthRestrictions.maxLength)
      ]);
    }

    this.editForm.controls.content.setValue(this.content() ?? '');

    this.editInputChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter(x => !!x),
      take(1)
    ).subscribe(elRef => {
      setTimeout(() => {
        elRef?.nativeElement.focus();
        elRef?.nativeElement.select();
      });
    });
  }
}
