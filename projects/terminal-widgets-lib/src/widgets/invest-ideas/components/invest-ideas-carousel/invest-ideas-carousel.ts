import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  forkJoin,
  Observable,
  of,
  switchMap
} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {
  NzCarouselComponent,
  NzCarouselContentDirective
} from "ng-zorro-antd/carousel";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {
  map,
  startWith
} from "rxjs/operators";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {InvestIdeasService} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {Idea} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {InvestIdeasDetailsDialog} from '@terminal-widgets-lib/widgets/invest-ideas/components/invest-ideas-details-dialog/invest-ideas-details-dialog';

@Component({
  selector: 'ats-invest-ideas-carousel',
  imports: [
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent,
    NzIconDirective,
    InstrumentIcon,
    InvestIdeasDetailsDialog
  ],
  templateUrl: './invest-ideas-carousel.html',
  styleUrl: './invest-ideas-carousel.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasCarousel implements OnInit {
  ideas$!: Observable<Idea[]>;

  instrumentSelected = output<InstrumentKey>();

  protected readonly selectedIdea = model<Idea | null>(null);

  private readonly investIdeasService = inject(InvestIdeasService);

  private readonly translatorService = inject(TranslatorService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly refreshInterval = 600_000;

  ngOnInit(): void {
    this.ideas$ = createRefresh(this.refreshInterval, this.applicationStatusService.isActive$)
      .pipe(
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
