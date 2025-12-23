import {
  Component,
  model,
  OnInit,
  output
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of,
  switchMap,
  timer
} from "rxjs";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { LetDirective } from "@ngrx/component";
import {
  NzCarouselComponent,
  NzCarouselContentDirective
} from "ng-zorro-antd/carousel";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  map,
  startWith
} from "rxjs/operators";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { InvestIdeasService } from "../../services/invest-ideas.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { Idea } from "../../services/invest-ideas-service-typings";
import { InvestIdeasDetailsDialogComponent } from "../invest-ideas-details-dialog/invest-ideas-details-dialog.component";

@Component({
  selector: 'ats-invest-ideas-carousel',
  imports: [
    InstrumentIconComponent,
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent,
    NzIconDirective,
    InvestIdeasDetailsDialogComponent
  ],
  templateUrl: './invest-ideas-carousel.component.html',
  styleUrl: './invest-ideas-carousel.component.less'
})
export class InvestIdeasCarouselComponent implements OnInit {
  ideas$!: Observable<Idea[]>;

  instrumentSelected = output<InstrumentKey>();

  protected readonly selectedIdea = model<Idea | null>(null);

  private readonly refreshInterval = 600_000;

  constructor(
    private readonly investIdeasService: InvestIdeasService,
    private readonly translatorService: TranslatorService,
    private readonly instrumentsService: InstrumentsService
  ) {
  }

  ngOnInit(): void {
    this.ideas$ = timer(0, this.refreshInterval).pipe(
      switchMap(() => this.investIdeasService.getIdeas(
        {
          pageNum: 1,
          pageSize: 20,
        },
        this.translatorService.getActiveLang()
      )),
      switchMap(r => {
        if (r == null || r.list == null) {
          return of([]);
        }

        const ideas = r.list;
        if (ideas.length === 0) {
          return of([]);
        }

        const updates$ = ideas.map(idea => {
          if (idea.symbols.length === 0) {
            return of(idea);
          }

          const symbolUpdates$ = idea.symbols.map(symbol => {
            if (symbol.shortName != null && symbol.shortName.length > 0) {
              return of(symbol);
            }

            return this.instrumentsService.getInstrument({
              symbol: symbol.ticker,
              exchange: symbol.exchange
            }).pipe(
              map(i => {
                if (i != null) {
                  symbol.shortName = i.shortName;
                }
                return symbol;
              }),
              startWith(symbol)
            );
          });

          return forkJoin(symbolUpdates$).pipe(
            map(() => idea)
          );
        });

        return forkJoin(updates$).pipe(
          map(updatedIdeas => updatedIdeas as Idea[])
        );
      })
    );
  }

  selectSymbol(symbol: InstrumentKey): void {
    this.instrumentSelected.emit(symbol);
    this.selectedIdea.set(null);
  }
}
