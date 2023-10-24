import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  forkJoin,
  fromEvent,
  Observable,
  of,
  take
} from "rxjs";
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import {
  filter,
  map
} from "rxjs/operators";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../services/instruments.service";
import { MarketService } from "../../../../shared/services/market.service";
import { toInstrumentKey } from "../../../../shared/utils/instruments";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NzUploadFile } from "ng-zorro-antd/upload";

export interface ImportDialogParams {
  listId: string;
}

interface ParsedItem {
  input: string;
  instrumentKey: InstrumentKey | null;
}

@Component({
  selector: 'ats-import-watchlist-dialog',
  templateUrl: './import-watchlist-dialog.component.html',
  styleUrls: ['./import-watchlist-dialog.component.less']
})
export class ImportWatchlistDialogComponent implements OnInit, OnDestroy {
  inputString = '';
  parsedResults$: Observable<ParsedItem[] | null> | null = null;
  private readonly dialogParams$ = new BehaviorSubject<ImportDialogParams | null>(null);
  isVisible$ = this.dialogParams$.pipe(
    map(p => !!p)
  );

  constructor(
    private readonly marketService: MarketService,
    private readonly instrumentsService: InstrumentsService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input({ required: true })
  set dialogParams(value: ImportDialogParams | null) {
    this.dialogParams$.next(value);
  }

  ngOnDestroy(): void {
    this.dialogParams$.complete();
  }

  ngOnInit(): void {
    this.dialogParams$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.inputString = '';
      this.parsedResults$ = null;
    });
  }

  closeDialog() {
    this.dialogParams = null;
  }

  parseInput() {
    if (!this.inputString?.length) {
      return;
    }

    const tickers = this.inputString
      .trim()
      .split(';');

    if (tickers.length === 0) {
      this.parsedResults$ = of(null);
      return;
    }

    this.marketService.getDefaultExchange().pipe(
      take(1),
      filter(x => !!x)
    ).subscribe(defaultExchange => {

      const itemsToResolve = tickers.map(t => {
        const rawTicker = t.trim();
        if (!rawTicker.length) {
          return null;
        }

        const parts = t.split(':');
        const exchange = parts.length > 1
          ? parts[0]
          : defaultExchange!;
        const symbol = parts.length > 1 ? parts[1] : parts[0];
        const instrumentGroup = parts[2];

        const instrumentKey: InstrumentKey = {
          exchange: exchange.toUpperCase(),
          symbol,
          instrumentGroup
        };

        return this.instrumentsService.getInstrument(instrumentKey).pipe(
          take(1),
          map(i => ({
            input: rawTicker,
            instrumentKey: !!i ? toInstrumentKey(i) : null
          } as ParsedItem))
        );
      })
        .filter((x): x is Observable<ParsedItem> => !!x);

      this.parsedResults$ = forkJoin(itemsToResolve).pipe(
        take(1)
      );
    });
  }

  getItemsToImport(parsedResults: ParsedItem[] | null): ParsedItem[] {
    return parsedResults?.filter(x => !!x.instrumentKey) ?? [];
  }

  import() {
    if (!this.parsedResults$) {
      this.closeDialog();
      return;
    }

    this.parsedResults$.pipe(
      take(1)
    ).subscribe(results => {
      const itemsToImport = this.getItemsToImport(results);

      if (itemsToImport.length === 0) {
        this.closeDialog();
        return;
      }

      this.dialogParams$.pipe(
        take(1),
        filter(x => !!x)
      ).subscribe(dialogParams => {
        this.watchlistCollectionService.addItemsToList(
          dialogParams?.listId!,
          itemsToImport.map(x => x.instrumentKey!),
          false);
        this.closeDialog();
      });
    });
  }

  downloadFile = (file: NzUploadFile) => {
    const reader = new FileReader();
    fromEvent(reader, 'load').pipe(
      take(1)
    ).subscribe(() => {
      this.inputString = (<string>reader.result) ?? '';
      this.parseInput();
      // ngModel doesn't work properly without explicit call of markForCheck
      this.cdr.markForCheck();
    });

    reader.readAsText(file as any as File);
    return false;
  };
}
