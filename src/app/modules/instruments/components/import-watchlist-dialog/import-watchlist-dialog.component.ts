import { ChangeDetectorRef, Component, DestroyRef, model, OnInit, inject } from '@angular/core';
import {forkJoin, fromEvent, Observable, of, shareReplay, take} from "rxjs";
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {filter, map} from "rxjs/operators";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {InstrumentsService} from "../../services/instruments.service";
import {MarketService} from "../../../../shared/services/market.service";
import {toInstrumentKey} from "../../../../shared/utils/instruments";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {NzUploadComponent, NzUploadFile} from "ng-zorro-antd/upload";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from 'ng-zorro-antd/modal';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {LetDirective} from '@ngrx/component';
import {
  NzTableCellDirective,
  NzTableComponent,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {AsyncPipe} from '@angular/common';

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
  styleUrls: ['./import-watchlist-dialog.component.less'],
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    NzInputDirective,
    FormsModule,
    NzUploadComponent,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    LetDirective,
    NzTableComponent,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzTbodyComponent,
    NzTypographyComponent,
    NzSpinComponent,
    NzModalFooterDirective,
    AsyncPipe
  ]
})
export class ImportWatchlistDialogComponent implements OnInit {
  private readonly marketService = inject(MarketService);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  inputString = '';
  parsedResults$: Observable<ParsedItem[] | null> | null = null;

  readonly dialogParams = model<ImportDialogParams | null>(null);
  private readonly dialogParamsChanges$ = toObservable(this.dialogParams).pipe(
    shareReplay(1),
  );

  isVisible$ = this.dialogParamsChanges$.pipe(
    map(p => !!p)
  );

  ngOnInit(): void {
    this.dialogParamsChanges$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.inputString = '';
      this.parsedResults$ = null;
    });
  }

  closeDialog(): void {
    this.dialogParams.set(null);
  }

  parseInput(): void {
    if (!this.inputString.length) {
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
      filter(x => x != null)
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

  import(): void {
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

      this.dialogParamsChanges$.pipe(
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

  downloadFile = (file: NzUploadFile): boolean => {
    const reader = new FileReader();
    fromEvent(reader, 'load').pipe(
      take(1)
    ).subscribe(() => {
      this.inputString = (reader.result as string | null) ?? '';
      this.parseInput();
      // ngModel doesn't work properly without explicit call of markForCheck
      this.cdr.markForCheck();
    });

    reader.readAsText(file as any as File);
    return false;
  };
}
