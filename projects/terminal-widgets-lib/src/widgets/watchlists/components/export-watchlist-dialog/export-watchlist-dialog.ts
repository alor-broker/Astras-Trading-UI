import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from "@terminal-core-lib/features/translations/services/translator.service";
import {
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {toObservable} from '@angular/core/rxjs-interop';
import {
  FileSaver,
  FileType
} from '@terminal-core-lib/common/utils/files/file-saver';
import {WatchlistCollectionService} from '@terminal-core-lib/features/watchlist/services/watchlist-collection.service';
import {Watchlist} from '@terminal-core-lib/features/watchlist/types/watchlist.types';
import {WatchListTitleHelper} from '@terminal-core-lib/features/watchlist/utils/watchlist-title.hepler';
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from 'ng-zorro-antd/modal';
import {AsyncPipe} from '@angular/common';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';

export interface ExportDialogParams {
  listId: string;
}

interface ExportResult {
  list: Watchlist;
  content: string | null;
}

@Component({
  selector: 'ats-export-watchlist-dialog',
  imports: [
    TranslocoDirective,
    LetDirective,
    NzModalComponent,
    AsyncPipe,
    NzInputDirective,
    NzModalContentDirective,
    NzButtonComponent,
    NzModalFooterDirective,
    NzTooltipDirective,
    NzIconDirective
  ],
  templateUrl: './export-watchlist-dialog.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportWatchlistDialog implements OnInit {
  exportResult$!: Observable<ExportResult>;

  readonly dialogParams = model<ExportDialogParams | null>(null);

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

  private readonly translatorService = inject(TranslatorService);

  private readonly dialogParamsChanges$ = toObservable(this.dialogParams).pipe(
    shareReplay(1)
  );

  isVisible$ = this.dialogParamsChanges$.pipe(
    map(p => !!p)
  );

  ngOnInit(): void {
    this.exportResult$ = this.dialogParamsChanges$.pipe(
      filter((p): p is ExportDialogParams => !!p),
      switchMap(p => this.getExportResult(p.listId)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  closeDialog(): void {
    this.dialogParams.set(null);
  }

  copyToClipboard(results: string): void {
    navigator.clipboard.writeText(results);
  }

  saveToFile(result: ExportResult): void {
    if (result.content == null || !result.content.length) {
      return;
    }

    this.translatorService.getTranslator('instruments').pipe(
      take(1)
    ).subscribe(translator => {
      FileSaver.save(
        {
          name: translator([WatchListTitleHelper.getTitleTranslationKey(result.list)], {fallback: result.list.title}),
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

      if (i.instrumentGroup != null && i.instrumentGroup.length > 0) {
        tickerParts.push(i.instrumentGroup);
      }

      return tickerParts.join(":");
    })
      .join(';');
  }
}
