import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  model,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {LetDirective} from "@ngrx/component";
import {
  NzCarouselComponent,
  NzCarouselContentDirective
} from "ng-zorro-antd/carousel";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {
  fromEvent,
  Observable,
  switchMap
} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {InvestIdeasService} from "../../services/invest-ideas.service";
import {AsyncPipe} from "@angular/common";
import {map} from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {Idea} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {IdeaDetails} from '@terminal-widgets-lib/widgets/invest-ideas/components/idea-details/idea-details';

interface IdeaDisplay extends Idea {
  instruments: Observable<Instrument | null>[];
}

@Component({
  selector: 'ats-invest-ideas-compact',
  imports: [
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent,
    AsyncPipe,
    TranslocoDirective,
    InstrumentIcon,
    IdeaDetails
  ],
  templateUrl: './invest-ideas-compact.html',
  styleUrl: './invest-ideas-compact.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasCompact implements OnInit {
  ideas$!: Observable<IdeaDisplay[]>;

  protected readonly selectedIdea = model<Idea | null>(null);

  protected readonly isLoading = signal<boolean>(false);

  private readonly investIdeasService = inject(InvestIdeasService);

  private readonly translatorService = inject(TranslatorService);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly refreshInterval = 600_000;

  ngOnInit(): void {
    fromEvent(window, 'popstate').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.selectedIdea.set(null);
    });

    this.ideas$ = createRefresh(this.refreshInterval, this.applicationStatusService.isActive$).pipe(
      switchMap(() => this.investIdeasService.getIdeas(
        {
          pageNum: 1,
          pageSize: 20,
        },
        this.translatorService.getActiveLang()
      )),
      map(r => {
        if (r == null) {
          return [];
        }

        return r.list.map(i => {
            return {
              title: i.title,
              body: i.body,
              symbols: i.symbols,
              instruments: i.symbols.map(s => this.instrumentsService.getInstrument({
                symbol: s.ticker,
                exchange: s.exchange
              }))
            };
          }
        );
      })
    );
  }

  openIdea(idea: Idea): void {
    this.selectedIdea.set(idea);
  }
}
