import { Component, DestroyRef, ElementRef, OnInit, ViewChild } from '@angular/core';
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
export class InstrumentSearchModalComponent implements OnInit {

  readonly minusSign = '－'; // This is not character that on keyboard
  private readonly specialSymbols = ['+', '*', '/', '[', ']', this.minusSign];

  isVisible$!: Observable<boolean>;

  private readonly expressionValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
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
    private readonly service: InstrumentSearchService,
    private readonly instrumentsService: InstrumentsService,
    private readonly destroyRef: DestroyRef,
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.service.isModalOpened$;

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

    this.service.modalParams$
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(params => this.searchControl.setValue(params));
  }

  handleCancel(): void {
    this.service.closeModal(null);
  }

  handleOk(): void {
    if (this.searchControl.invalid) {
      return;
    }

    this.service.closeModal(this.searchControl.value!.replace(this.minusSign, '-'));
  }

  filterChanged(): void {
    const inputVal = this.searchControl.value ?? '';
    const caretPos = this.searchInput.nativeElement.selectionStart ?? 0;

    const strBeforeCaret = inputVal.slice(0, caretPos);
    const strAfterCaret = inputVal.slice(caretPos);

    const cutStrStart = this.getLastSpecialSymbolIndex(strBeforeCaret);
    const cutStrEnd = this.getFirstSpacialSymbolIndex(strAfterCaret);

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
        const strBeforeCaret = inputVal.slice(0, caretPos);
        const strAfterCaret = inputVal.slice(caretPos);

        let cutStrStart = this.getLastSpecialSymbolIndex(strBeforeCaret);
        let cutStrEnd = this.getFirstSpacialSymbolIndex(strAfterCaret);

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
    let i = str.length - 1;

    while(i >= 0) {
      if (this.specialSymbols.includes(str[i])) {
        return i + 1;
      }

      i--;
    }

    return 0;
  }

  private getFirstSpacialSymbolIndex(str: string): number {
    let i = 0;

    while(i <= str.length) {
      if (this.specialSymbols.includes(str[i])) {
        return i;
      }

      i++;
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
