import { Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { BehaviorSubject, Observable, of, tap } from "rxjs";
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { debounceTime, switchMap } from "rxjs/operators";
import { SearchFilter } from "../../../instruments/models/search-filter.model";
import { NzOptionSelectionChange } from "ng-zorro-antd/auto-complete";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SyntheticInstrumentsHelper } from "../../utils/synthetic-instruments.helper";

@Component({
  selector: 'ats-instrument-search-modal',
  templateUrl: './instrument-search-modal.component.html',
  styleUrl: './instrument-search-modal.component.less'
})
export class InstrumentSearchModalComponent implements OnInit, OnDestroy {

  readonly minusSign = '－'; // This is not character that on keyboard
  private readonly specialSymbolsRegEx = new RegExp(`[${this.minusSign}+*/\\]\\[]`, 'g');

  isVisible$!: Observable<boolean>;

  private readonly expressionValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if ((control.value?.length ?? 0) === 0) {
      return null;
    }

    if (SyntheticInstrumentsHelper.isSyntheticInstrumentValid((control.value ?? '').replace(this.minusSign, '-'))) {
      return null;
    }

    return { expressionInvalid: true, warning: true };
  };

  searchControl = new FormControl('', [ Validators.required, this.expressionValidator ]);

  filteredInstruments$!: Observable<Instrument[] | null>;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly filter$ = new BehaviorSubject<SearchFilter | null>(null);
  autocompleteLoading$ = new BehaviorSubject(false);

  constructor(
    private readonly instrumentSearchService: InstrumentSearchService,
    private readonly instrumentsService: InstrumentsService,
    private readonly destroyRef: DestroyRef,
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.instrumentSearchService.isModalOpened$;

    this.filteredInstruments$ = this.filter$.pipe(
      tap(() => this.autocompleteLoading$.next(true)),
      debounceTime(200),
      switchMap(filter => {
          if (!filter) {
            return of([]);
          }
          return this.instrumentsService.getInstruments(filter);
        }
      ),
      tap(() => this.autocompleteLoading$.next(false))
    );

    this.instrumentSearchService.modalParams$
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => this.searchControl.setValue(params));
  }

  ngOnDestroy(): void {
    this.filter$.complete();
    this.autocompleteLoading$.complete();
  }

  handleCancel(): void {
    this.instrumentSearchService.closeModal(null);
  }

  handleOk(): void {
    if (this.searchControl.invalid) {
      return;
    }

    this.instrumentSearchService.closeModal(this.searchControl.value!.replace(this.minusSign, '-'));
  }

  filterChanged(): void {
    // Get part of the search string from first special symbol to left from caret to first special symbol to right from caret
    const inputVal = this.searchControl.value ?? '';
    const caretPos = this.searchInput.nativeElement.selectionStart ?? 0;

    const strBeforeCaret = inputVal.slice(0, caretPos);
    const strAfterCaret = inputVal.slice(caretPos);

    const cutStrStart = this.getLastSpecialSymbolIndex(strBeforeCaret);
    const cutStrEnd = this.getFirstSpecialSymbolIndex(strAfterCaret);

    const searchVal = strBeforeCaret.slice(cutStrStart, caretPos) + strAfterCaret.slice(caretPos, cutStrEnd);

    const filter = {
      limit: 20
    } as SearchFilter;

    if (searchVal.includes(':')) {
      const parts = searchVal.split(':');

      let nextPartIndex = 0;
      filter.exchange = parts[nextPartIndex].toUpperCase();
      nextPartIndex++;

      filter.query = parts[nextPartIndex];
      nextPartIndex++;
      filter.instrumentGroup = parts[nextPartIndex]?.toUpperCase() ?? '';
    } else {
      filter.query = searchVal;
    }

    this.filter$.next(filter);
  }

  onSelect(event: NzOptionSelectionChange, val: InstrumentKey): void {
    if (event.isUserInput) {
      const inputVal = this.searchControl.value ?? '';
      const caretPos = this.searchInput.nativeElement.selectionStart ?? 0;

      setTimeout(() => {
        // Get string part that will be replaced by new instrument
        const strBeforeCaret = inputVal.slice(0, caretPos);
        const strAfterCaret = inputVal.slice(caretPos);

        let cutStrStart = this.getLastSpecialSymbolIndex(strBeforeCaret);
        let cutStrEnd = this.getFirstSpecialSymbolIndex(strAfterCaret);

        if (strBeforeCaret[cutStrStart - 1] === '[') {
          cutStrStart--;
        }

        if (strAfterCaret[cutStrEnd] === ']') {
          cutStrEnd++;
        }

        this.searchControl.setValue([
            strBeforeCaret.slice(0, cutStrStart),
            `[${val.exchange}:${val.symbol}${val.instrumentGroup == null ? '' : ':' + val.instrumentGroup}]`,
            strAfterCaret.slice(cutStrEnd),
          ]
            .join('')
        );
      }, 0);

    }
  }

  addSpreadOperator(operator: string): void {
    this.searchControl.setValue(this.searchControl.value + operator);
    this.searchInput.nativeElement.focus();
  }

  private getLastSpecialSymbolIndex(str: string): number {
    const i = str.split('').reverse().findIndex(c => this.specialSymbolsRegEx.test(c));

    if (i === -1) {
      return 0;
    }

    return str.length - i;

  }

  private getFirstSpecialSymbolIndex(str: string): number {
    const i = str.split('').findIndex(c => this.specialSymbolsRegEx.test(c));

     if (i === -1) {
       return str.length - 1;
     }

     return i;
  }

  modalOpened(): void {
    setTimeout(() => {
      this.searchInput.nativeElement.focus();
      this.searchInput.nativeElement.selectionStart = 0;
      this.searchInput.nativeElement.selectionEnd = this.searchControl.value?.length ?? 0;
    }, 0);
  }
}
