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
  FormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-editable-string[content]',
  templateUrl: './editable-string.component.html',
  styleUrls: ['./editable-string.component.less']
})
export class EditableStringComponent implements OnInit, OnDestroy {
  @ViewChildren('editInput')
  editInput!: QueryList<ElementRef<HTMLInputElement>>;

  @Input()
  content: string | null = null;
  @Input()
  lenghtRestrictions?: {
    minLenght: number,
    maxLength: number
  };

  @Input()
  inputClass: string = '';

  @Output()
  contentChanged = new EventEmitter<string>();

  isEditMode$ = new BehaviorSubject(false);
  editForm?: UntypedFormGroup;

  constructor(private readonly destroyRef: DestroyRef) {
  }

  ngOnInit(): void {
    this.isEditMode$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(x => x)
    ).subscribe(() => {
      this.initForm();
    });
  }

  setEditMode(value: boolean) {
    this.isEditMode$.next(value);
  }

  ngOnDestroy(): void {
    this.isEditMode$.complete();
  }

  checkInputCompleteOrCancel(event: KeyboardEvent) {
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

  emitValueIfValid() {
    if (this.editForm?.valid) {
      this.contentChanged.emit(this.editForm.value.content);
    }

    this.setEditMode(false);
  }

  private initForm() {
    if (!this.editForm) {
      const validators = [];
      if (this.lenghtRestrictions) {
        validators.push(Validators.required);
        validators.push(Validators.minLength(this.lenghtRestrictions.minLenght));
        validators.push(Validators.maxLength(this.lenghtRestrictions.maxLength));
      }

      this.editForm = new UntypedFormGroup({
        content: new FormControl(this.content, validators)
      });
    }
    else {
      this.editForm.controls.content.setValue(this.content);
    }

    const setFocus = (el: HTMLInputElement) => setTimeout(() => el.focus());

    if (this.editInput.length > 0) {
      setFocus(this.editInput.first.nativeElement);
    }
    else {
      this.editInput.changes.pipe(
        take(1)
      ).subscribe((x: QueryList<ElementRef<HTMLInputElement>>) => setFocus(x.first.nativeElement));
    }
  }
}
