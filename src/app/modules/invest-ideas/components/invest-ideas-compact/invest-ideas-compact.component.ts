import {
  Component,
  DestroyRef,
  model,
  OnInit,
  signal
} from '@angular/core';
import { LetDirective } from "@ngrx/component";
import {
  NzCarouselComponent,
  NzCarouselContentDirective
} from "ng-zorro-antd/carousel";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import {
  fromEvent,
  Observable,
  switchMap,
  timer
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { Idea } from "../../services/invest-ideas-service-typings";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { InvestIdeasService } from "../../services/invest-ideas.service";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import { IdeaDetailsComponent } from "../idea-details/idea-details.component";
import { AsyncPipe } from "@angular/common";
import { map } from "rxjs/operators";
import { TranslocoDirective } from "@jsverse/transloco";

interface IdeaDisplay extends Idea {
  instruments: Observable<Instrument | null>[];
}

@Component({
  selector: 'ats-invest-ideas-compact',
  imports: [
    InstrumentIconComponent,
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent,
    IdeaDetailsComponent,
    AsyncPipe,
    TranslocoDirective
  ],
  templateUrl: './invest-ideas-compact.component.html',
  styleUrl: './invest-ideas-compact.component.less'
})
export class InvestIdeasCompactComponent implements OnInit {
  ideas$!: Observable<IdeaDisplay[]>;

  protected selectedIdea = model<Idea | null>(null);

  protected isLoading = signal<boolean>(false);

  private readonly refreshInterval = 600_000;

  constructor(
    private readonly investIdeasService: InvestIdeasService,
    private readonly translatorService: TranslatorService,
    private readonly instrumentsService: InstrumentsService,
    private readonly destroyRef: DestroyRef) {
  }

  ngOnInit(): void {
    fromEvent(window, 'popstate').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.selectedIdea.set(null);
    });

    this.ideas$ = timer(0, this.refreshInterval).pipe(
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
