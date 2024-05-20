import {
  Component, DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {
  BehaviorSubject,
  filter,
  take,
} from 'rxjs';
import {
  FormBuilder,
  Validators
} from '@angular/forms';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  map,
  startWith
} from "rxjs/operators";

@Component({
  selector: 'ats-editable-string',
  templateUrl: './editable-string.component.html',
  styleUrls: ['./editable-string.component.less']
})
export class EditableStringComponent implements OnInit, OnDestroy {
  @ViewChildren('editInput')
  editInput!: QueryList<ElementRef<HTMLInputElement>>;

  @Input({required: true})
  content: string | null = null;

  @Input()
  lengthRestrictions?: {
    minLength: number;
    maxLength: number;
  };

  @Input()
  inputClass = '';

  @Output()
  contentChanged = new EventEmitter<string>();

  isEditMode$ = new BehaviorSubject(false);
  editForm = this.formBuilder.group({
    content: this.formBuilder.nonNullable.control('')
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
  }

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

    if(event.key === "Esc") {
      this.setEditMode(false);
      event.stopPropagation();
      event.preventDefault();
    }
  }

  emitValueIfValid(): void {
    if (this.editForm.valid ?? false) {
      this.contentChanged.emit(this.editForm!.value.content);
    }

    this.setEditMode(false);
  }

  private initForm(): void {
    this.editForm.reset();
    this.editForm.controls.content.clearValidators();

    if (this.lengthRestrictions) {
      this.editForm.controls.content.addValidators([
        Validators.required,
        Validators.minLength(this.lengthRestrictions.minLength),
        Validators.maxLength(this.lengthRestrictions.maxLength)
      ]);
    }

    this.editForm.controls.content.setValue(this.content ?? '');

    this.editInput.changes.pipe(
      map(x => x.first as ElementRef | undefined),
      startWith(this.editInput.first),
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
