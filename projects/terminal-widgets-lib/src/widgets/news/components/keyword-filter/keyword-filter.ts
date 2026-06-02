import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {
  NzFormControlComponent,
  NzFormDirective
} from "ng-zorro-antd/form";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzInputModule} from "ng-zorro-antd/input";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzSpaceCompactComponent} from 'ng-zorro-antd/space';

interface ValidationOptions {
  minLength: number;
  maxLength: number;
}

@Component({
  selector: 'ats-keyword-filter',
  imports: [
    NzFormControlComponent,
    NzFormDirective,
    NzIconDirective,
    NzTagComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    NzInputModule,
    NzButtonComponent,
    NzSpaceCompactComponent
  ],
  templateUrl: './keyword-filter.html',
  styleUrl: './keyword-filter.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class KeywordFilter implements OnChanges {
  readonly validationOptions = input.required<ValidationOptions>();

  readonly currentKeywords = input<string[]>();

  readonly newKeywordPlaceholder = input<string>();

  readonly tagColor = input<string>();

  keywordAdded = output<string>();

  keywordRemoved = output<string>();

  protected displayKeywords: string[] = [];

  private readonly formBuilder = inject(FormBuilder);

  readonly newKeywordForm = this.formBuilder.group({
    newKeyword: this.formBuilder.nonNullable.control('')
  });

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
