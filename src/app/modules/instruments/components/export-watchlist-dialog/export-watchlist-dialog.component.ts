import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  filter,
  map
} from "rxjs/operators";
import { WatchlistCollectionService } from "../../services/watchlist-collection.service";
import { Watchlist } from "../../models/watchlist.model";
import { TranslatorService } from "../../../../shared/services/translator.service";
import {
  FileSaver,
  FileType
} from "../../../../shared/utils/file-export/file-saver";
import { WatchListTitleHelper } from "../../utils/watch-list-title.helper";


export interface ExportDialogParams {
  listId: string;
}

interface ExportResult {
  list: Watchlist;
  content: string | null;
}

@Component({
  selector: 'ats-export-watchlist-dialog',
  templateUrl: './export-watchlist-dialog.component.html',
  styleUrls: ['./export-watchlist-dialog.component.less']
})
export class ExportWatchlistDialogComponent implements OnInit, OnDestroy {
  exportResult$!: Observable<ExportResult>;
  private readonly dialogParams$ = new BehaviorSubject<ExportDialogParams | null>(null);
  isVisible$ = this.dialogParams$.pipe(
    map(p => !!p)
  );

  constructor(
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly translatorService: TranslatorService
  ) {
  }

  @Input({ required: true })
  set dialogParams(value: ExportDialogParams | null) {
    this.dialogParams$.next(value);
  }

  ngOnDestroy(): void {
    this.dialogParams$.complete();
  }

  ngOnInit(): void {
    this.exportResult$ = this.dialogParams$.pipe(
      filter((p): p is ExportDialogParams => !!p),
      switchMap(p => this.getExportResult(p.listId)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  closeDialog(): void {
    this.dialogParams = null;
  }

  copyToClipboard(results: string): void {
    navigator.clipboard.writeText(results);
  }

  saveToFile(result: ExportResult): void {
    if (!(result.content ?? '')) {
      return;
    }

    this.translatorService.getTranslator('instruments').pipe(
      take(1)
    ).subscribe(translator => {
      FileSaver.save(
        {
          name: translator([WatchListTitleHelper.getTitleTranslationKey(result.list)], { fallback: result.list.title }),
          fileType: FileType.Txt
        },
        result.content!
      );
    });
  }

  private getExportResult(listId: string): Observable<ExportResult> {
    return this.watchlistCollectionService.getWatchlistCollection().pipe(
      take(1),
      map(c => c.collection.find(wl => wl.id === listId)),
      map(wl => {
        if (!wl || wl.items.length === 0) {
          return {
            list: wl,
            content: null
          } as ExportResult;
        }

        return {
          list: wl,
          content: this.exportItemsToString(wl)
        } as ExportResult;
      })
    );
  }

  private exportItemsToString(list: Watchlist): string {
    return list.items.map(i => {
      const tickerParts: string[] = [
        i.exchange,
        i.symbol
      ];

      if (!!(i.instrumentGroup ?? '')) {
        tickerParts.push(i.instrumentGroup as string);
      }

      return tickerParts.join(":");
    })
      .join(';');
  }
}
