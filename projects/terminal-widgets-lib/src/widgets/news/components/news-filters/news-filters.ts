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
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import {
  FormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {TranslocoDirective} from "@jsverse/transloco";
import {KeywordFilter} from '@terminal-widgets-lib/widgets/news/components/keyword-filter/keyword-filter';

export interface Filters {
  includedKeyWords: string[];
  excludedKeyWords: string[];
  symbols: string[];
}

@Component({
  selector: 'ats-news-filters',
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    NzIconDirective,
    NzButtonComponent,
    NzTooltipDirective,
    ReactiveFormsModule,
    TranslocoDirective,
    KeywordFilter
  ],
  templateUrl: './news-filters.html',
  styleUrl: './news-filters.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class NewsFilters implements OnChanges {
  readonly validationOptions = {
    keyword: {
      minLength: 2,
      maxLength: 50
    },
    symbol: {
      minLength: 1,
      maxLength: 20
    }
  };

  readonly isVisible = input.required<boolean>();

  readonly currentFilters = input<Filters | null>();

  closed = output<Filters | null>();

  protected includedKeywords: string[] = [];

  protected excludedKeywords: string[] = [];

  protected symbols: string[] = [];

  private readonly formBuilder = inject(FormBuilder);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.currentFilters != null) {
      this.setInitialValues();
    }
  }

  addIncludedKeyWord(value: string): void {
    if (this.includedKeywords.find(w => w.toLowerCase() === value.toLowerCase()) == null) {
      this.includedKeywords = [
        ...this.includedKeywords,
        value
      ];
    }
  }

  removeIncludedKeyWord(value: string): void {
    this.includedKeywords = this.includedKeywords.filter(w => w !== value);
  }

  clearIncludedWords(): void {
    this.includedKeywords = [];
  }

  addExcludedKeyWord(value: string): void {
    if (this.excludedKeywords.find(w => w.toLowerCase() === value.toLowerCase()) == null) {
      this.excludedKeywords = [
        ...this.excludedKeywords,
        value
      ];
    }
  }

  removeExcludedKeyWord(value: string): void {
    this.excludedKeywords = this.excludedKeywords.filter(w => w !== value);
  }

  clearExcludedWords(): void {
    this.excludedKeywords = [];
  }

  addSymbol(value: string): void {
    if (this.symbols.find(s => s.toLowerCase() === value.toLowerCase()) == null) {
      this.symbols = [
        ...this.symbols,
        value
      ];
    }
  }

  removeSymbol(value: string): void {
    this.symbols = this.symbols.filter(w => w !== value);
  }

  clearSymbols(): void {
    this.symbols = [];
  }

  applyFilters(): void {
    this.closeWithResult({
      includedKeyWords: [...this.includedKeywords],
      excludedKeyWords: [...this.excludedKeywords],
      symbols: [...this.symbols]
    });
  }

  cancel(): void {
    this.closeWithResult(this.currentFilters() ?? null);
    this.setInitialValues();
  }

  private setInitialValues(): void {
    const current = this.currentFilters();

    this.includedKeywords = [...current?.includedKeyWords ?? []];
    this.excludedKeywords = [...current?.excludedKeyWords ?? []];
    this.symbols = [...current?.symbols ?? []];
  }

  private closeWithResult(result: Filters | null): void {
    this.closed.emit(result);
  }
}
