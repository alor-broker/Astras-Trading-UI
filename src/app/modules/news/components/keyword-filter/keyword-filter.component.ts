import {
  Component,
  input,
  OnChanges,
  output,
  SimpleChanges
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import { NzButtonComponent } from "ng-zorro-antd/button";
import {
  NzFormControlComponent,
  NzFormDirective
} from "ng-zorro-antd/form";
import { NzIconDirective } from "ng-zorro-antd/icon";
import {
  NzInputDirective,
  NzInputGroupComponent
} from "ng-zorro-antd/input";
import { NzTagComponent } from "ng-zorro-antd/tag";
import { TranslocoDirective } from "@jsverse/transloco";

interface ValidationOptions {
  minLength: number;
  maxLength: number;
}

@Component({
  selector: 'ats-keyword-filter',
  imports: [
    NzButtonComponent,
    NzFormControlComponent,
    NzFormDirective,
    NzIconDirective,
    NzInputDirective,
    NzInputGroupComponent,
    NzTagComponent,
    ReactiveFormsModule,
    TranslocoDirective
  ],
  templateUrl: './keyword-filter.component.html',
  styleUrl: './keyword-filter.component.less'
})
export class KeywordFilterComponent implements OnChanges {
  validationOptions = input.required<ValidationOptions>();

  currentKeywords = input<string[]>();

  newKeywordPlaceholder = input<string>();

  tagColor = input<string>();

  keywordAdded = output<string>();

  keywordRemoved = output<string>();

  readonly newKeywordForm = this.formBuilder.group({
    newKeyword: this.formBuilder.nonNullable.control('')
  });

  protected displayKeywords: string[] = [];

  constructor(private readonly formBuilder: FormBuilder) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.validationOptions != null && changes.validationOptions.currentValue != null) {
      const newOptions = changes.validationOptions.currentValue as ValidationOptions;

      this.newKeywordForm.reset();
      this.newKeywordForm.controls.newKeyword.clearValidators();
      this.newKeywordForm.controls.newKeyword.addValidators([
        Validators.required,
        Validators.minLength(newOptions.minLength),
        Validators.maxLength(newOptions.maxLength),
      ]);
    }

    if (changes.currentKeywords != null) {
      this.newKeywordForm.reset();
      const current = changes.currentKeywords.currentValue as string | null;
      this.displayKeywords.length = 0;
      this.displayKeywords.push(...(current ?? []));
    }
  }

  addKeyword(): void {
    if (this.newKeywordForm.valid) {
      this.keywordAdded.emit(this.newKeywordForm.value.newKeyword!);
      this.newKeywordForm.reset();
    }
  }

  removeKeyword(value: string): void {
    this.keywordRemoved.emit(value);
  }
}
