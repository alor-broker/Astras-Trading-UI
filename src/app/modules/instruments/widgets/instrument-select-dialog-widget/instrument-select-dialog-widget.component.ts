import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, viewChildren, inject } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Exchange} from "../../../../../generated/graphql.types";
import {Board} from "../../../all-instruments/model/boards.model";
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputModule} from 'ng-zorro-antd/input';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {MarketService} from "../../../../shared/services/market.service";
import {combineLatest, map, Observable, shareReplay, switchMap} from "rxjs";
import {TranslocoDirective} from "@jsverse/transloco";
import {BoardsService} from "../../../all-instruments/services/boards.service";
import {InstrumentSelectDialogService} from "../../services/instrument-select-dialog.service";
import {NzModalComponent, NzModalContentDirective} from "ng-zorro-antd/modal";
import {LetDirective} from "@ngrx/component";
import {debounceTime, filter, startWith} from "rxjs/operators";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {SearchInstrumentStore, SearchStatus} from "../../utils/search-instrument-store";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {SearchResultsListComponent} from "../../components/search-results-list/search-results-list.component";
import {AsyncPipe} from "@angular/common";

@Component({
  selector: 'ats-instrument-select-dialog-widget',
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    TranslocoDirective,
    NzModalComponent,
    LetDirective,
    NzModalContentDirective,
    NzIconDirective,
    NzSpinComponent,
    NzEmptyComponent,
    SearchResultsListComponent,
    AsyncPipe
  ],
  templateUrl: './instrument-select-dialog-widget.component.html',
  styleUrl: './instrument-select-dialog-widget.component.less',
  providers: [
    SearchInstrumentStore
  ]
})
export class InstrumentSelectDialogWidgetComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly formBuilder = inject(FormBuilder);
  private readonly marketService = inject(MarketService);
  private readonly boardsService = inject(BoardsService);
  private readonly instrumentSelectDialogService = inject(InstrumentSelectDialogService);
  private readonly searchInstrumentStore = inject(SearchInstrumentStore);
  private readonly destroyRef = inject(DestroyRef);

  exchanges$!: Observable<string[]>;
  boards$!: Observable<Board[]>;
  selectParams$ = this.instrumentSelectDialogService.selectParams$;

  searchState$ = this.searchInstrumentStore.state$;

  readonly SearchStatuses = SearchStatus;

  readonly instrumentNameControlQuery = viewChildren<ElementRef<HTMLInputElement>>('instrumentNameControl');

  readonly validationsOptions = {
    instrumentName: {
      maxLength: 50
    }
  };

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

  private readonly instrumentNameControlQueryChanges$ = toObservable(this.instrumentNameControlQuery);

  ngOnDestroy(): void {
    this.searchInstrumentStore.ngOnDestroy();
  }

  ngAfterViewInit(): void {
    this.selectParams$.pipe(
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
    this.instrumentSelectDialogService.closeDialog();
  }

  getBoardLabel(board: Board): string {
    return `${board.code} (${board.description})`;
  }

  private initAvailableBoards(): void {
    this.boards$ = combineLatest({
      allBoards: this.boardsService.getAllBoards(),
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
