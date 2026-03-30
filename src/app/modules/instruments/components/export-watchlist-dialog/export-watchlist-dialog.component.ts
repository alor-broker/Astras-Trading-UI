import { Component, model, OnInit, inject } from '@angular/core';
import {Observable, shareReplay, switchMap, take} from "rxjs";
import {filter, map} from "rxjs/operators";
import {WatchlistCollectionService} from "../../services/watchlist-collection.service";
import {Watchlist} from "../../models/watchlist.model";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {FileSaver, FileType} from "../../../../shared/utils/file-export/file-saver";
import {WatchListTitleHelper} from "../../utils/watch-list-title.helper";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from 'ng-zorro-antd/modal';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';
import {toObservable} from "@angular/core/rxjs-interop";

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
  styleUrls: ['./export-watchlist-dialog.component.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzModalComponent,
    NzModalContentDirective,
    NzInputDirective,
    NzModalFooterDirective,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    AsyncPipe
  ]
})
export class ExportWatchlistDialogComponent implements OnInit {
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly translatorService = inject(TranslatorService);

  exportResult$!: Observable<ExportResult>;
  readonly dialogParams = model<ExportDialogParams | null>(null);
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
