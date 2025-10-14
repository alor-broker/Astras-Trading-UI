import {
  Component,
  DestroyRef,
  OnInit,
  output
} from '@angular/core';
import {
  filter,
  Observable,
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
import { HistoryService } from "../../../../shared/services/history.service";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { map } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MathHelper } from "../../../../shared/utils/math-helper";
import {
  AsyncPipe,
  NgClass
} from "@angular/common";
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { InvestIdeasService } from "../../services/invest-ideas.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

interface InstrumentDisplay {
  instrument$: Observable<Instrument | null>;
  priceInfo$: Observable<InstrumentPrice>;
}

interface IdeaDisplay {
  title: string;
  body: string;
  instruments: InstrumentDisplay[];
}

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
    NgClass,
    NzModalComponent,
    NzModalContentDirective,
    NzIconDirective,
    AsyncPipe
  ],
  templateUrl: './invest-ideas-carousel.component.html',
  styleUrl: './invest-ideas-carousel.component.less'
})
export class InvestIdeasCarouselComponent implements OnInit {
  ideas$!: Observable<IdeaDisplay[]>;

  instrumentSelected = output<InstrumentKey>();

  protected selectedIdea: IdeaDisplay | null = null;

  private readonly refreshInterval = 600_000;

  constructor(
    private readonly investIdeasService: InvestIdeasService,
    private readonly historyService: HistoryService,
    private readonly translatorService: TranslatorService,
    private readonly instrumentsService: InstrumentsService,
    private readonly destroyRef: DestroyRef
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
      map(r => {
        if (r == null) {
          return [];
        }

        return r.list.map(i => {
            return {
              title: i.title,
              body: i.body,
              instruments: i.symbols.map(symbol => {
                const instrumentKey: InstrumentKey = {symbol: symbol.ticker, exchange: symbol.exchange};
                return {
                  instrument$: this.instrumentsService.getInstrument(instrumentKey),
                  priceInfo$: this.getPriceInfo(instrumentKey)
                };
              })
            };
          }
        );
      })
    );
  }

  private getPriceInfo(instrumentKey: InstrumentKey): Observable<InstrumentPrice> {
    return timer(0, 60_000).pipe(
      switchMap(() => this.historyService.getLastTwoCandles(instrumentKey)),
      map(r => {
        if (r == null || (r.cur == null && r.prev == null)) {
          return null;
        }

        return {
          lastPrice: r.cur.close ?? r.prev.close,
          dayChangePercent: this.getDayPercentChange(r.cur.close, r.prev.close)
        };
      }),
      filter(x => x != null),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private getDayPercentChange(lastPrice?: number, closePrice?: number): number {
    if (lastPrice == null || closePrice == null) {
      return 0;
    }
    return MathHelper.round((1 - (closePrice / lastPrice)) * 100, 2);
  }
}
