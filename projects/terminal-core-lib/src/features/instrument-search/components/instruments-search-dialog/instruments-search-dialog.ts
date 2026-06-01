import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  model,
  OnDestroy,
  OnInit,
  viewChildren,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {NzFormModule} from 'ng-zorro-antd/form';
import {
  NzInputModule,
  NzInputPrefixDirective,
  NzInputWrapperComponent
} from 'ng-zorro-antd/input';
import {
  NzOptionComponent,
  NzSelectComponent,
} from 'ng-zorro-antd/select';
import {
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {TranslocoDirective} from "@jsverse/transloco";
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import {LetDirective} from "@ngrx/component";
import {
  debounceTime,
  filter,
  startWith
} from "rxjs/operators";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {AsyncPipe} from "@angular/common";
import {
  SearchInstrumentStore,
  SearchStatus
} from '../../utils/search-instrument-store';
import {InstrumentsService} from '../../../instruments/services/instruments.service';
import {Board} from '../../../instruments/services/instruments-service.types';
import {Exchange} from '../../../instruments/graphql/schema/graphql.types';
import {MarketService} from '../../../market-config/market.service';
import {SearchResultsList} from '../search-results-list/search-results-list';

export type SearchParameters = object;

@Component({
  selector: 'ats-instruments-search-dialog',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzModalComponent,
    ReactiveFormsModule,
    NzModalContentDirective,
    NzFormModule,
    NzInputWrapperComponent,
    NzInputPrefixDirective,
    NzIconDirective,
    NzSelectComponent,
    NzOptionComponent,
    AsyncPipe,
    NzSpinComponent,
    NzEmptyComponent,
    SearchResultsList,
    NzInputModule
  ],
  templateUrl: './instruments-search-dialog.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SearchInstrumentStore]
})
export class InstrumentsSearchDialog implements OnInit, AfterViewInit, OnDestroy {
  exchanges$!: Observable<string[]>;

  boards$!: Observable<Board[]>;

  readonly searchParameters = model<SearchParameters | null>(null);

  readonly SearchStatuses = SearchStatus;

  readonly instrumentNameControlQuery = viewChildren<ElementRef<HTMLInputElement>>('instrumentNameControl');

  readonly validationsOptions = {
    instrumentName: {
      maxLength: 50
    }
  };

  private readonly formBuilder = inject(FormBuilder);

  readonly searchForm = this.formBuilder.group({
    instrumentName: this.formBuilder.nonNullable.control(
      '',
      {
        validators: [
          Validators.maxLength(this.validationsOptions.instrumentName.maxLength)
        ],
      }
    ),
    exchange: this.formBuilder.nonNullable.control<Exchange | null>(null),
    board: this.formBuilder.nonNullable.control<Board | null>(null),
  });

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly searchInstrumentStore = inject(SearchInstrumentStore);

  searchState$ = this.searchInstrumentStore.state$;

  private readonly destroyRef = inject(DestroyRef);

  private readonly marketService = inject(MarketService);

  private readonly instrumentNameControlQueryChanges$ = toObservable(this.instrumentNameControlQuery);

  private readonly searchParametersChanges$ = toObservable(this.searchParameters);

  ngOnDestroy(): void {
    this.searchInstrumentStore.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.searchParametersChanges$.pipe(
      switchMap(() => this.instrumentNameControlQueryChanges$)
    ).pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter((x): x is ElementRef<HTMLInputElement> => !!x),
      map(x => x.nativeElement),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(el => {
      setTimeout(
        () => {
          el.select();
        },
        500
      );
    });
  }

  ngOnInit(): void {
    this.initAvailableExchanges();
    this.initAvailableBoards();

    this.searchForm.valueChanges.pipe(
      filter(() => this.searchForm.valid),
      debounceTime(500),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.executeSearch());
  }

  closeDialog(): void {
    this.searchParameters.set(null);
  }

  getBoardLabel(board: Board): string {
    return `${board.code} (${board.description})`;
  }

  private initAvailableBoards(): void {
    this.boards$ = combineLatest({
      allBoards: this.instrumentsService.getAllBoards(),
      selectedExchange: this.searchForm.controls.exchange.valueChanges.pipe(startWith(null)),
    }).pipe(
      map(x => {
        if (x.allBoards == null) {
          return [];
        }
        if (x.selectedExchange != null) {
          return x.allBoards.filter(e => e.exchange === x.selectedExchange as string);
        }

        return x.allBoards;
      }),
      map(b => b.sort((a, b) => a.code.localeCompare(b.code))),
      shareReplay(1)
    );
  }

  private initAvailableExchanges(): void {
    const allExchanges$ = this.marketService.getAllExchanges().pipe(
      map(exchanges =>
        exchanges.filter(e => e.settings.hasInstruments ?? true)
          .map(e => e.exchange)
      )
    );

    this.exchanges$ = combineLatest({
      allExchanges: allExchanges$,
      selectedBoard: this.searchForm.controls.board.valueChanges.pipe(startWith(null)),
    }).pipe(
      map(x => {
        if (x.selectedBoard == null) {
          return x.allExchanges;
        }

        return x.allExchanges.filter(e => e === x.selectedBoard!.exchange);
      })
    );
  }

  private executeSearch(): void {
    const filters = this.searchForm.value;
    if (filters.instrumentName == null || filters.instrumentName.length === 0) {
      return;
    }

    this.searchInstrumentStore.searchByFilters({
      instrumentName: filters.instrumentName!.trim(),
      exchange: filters.exchange ?? null,
      board: filters.board?.code ?? null
    });
  }
}
