import {
  Component,
  DestroyRef,
  OnInit,
  output
} from '@angular/core';
import {
  BehaviorSubject,
  filter,
  Observable,
  switchMap,
  timer
} from "rxjs";
import {
  Idea,
  Section
} from "../../models/ideas-typings.model";
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
import { NgClass } from "@angular/common";
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { NzIconDirective } from "ng-zorro-antd/icon";

interface InstrumentPrice {
  lastPrice: number;
  dayChangePercent: number;
}

interface IdeaDisplay extends Idea {
  priceInfo$: Observable<InstrumentPrice>;
}

interface SectionDisplay extends Section {
  ideas: IdeaDisplay[];
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
    NzIconDirective
  ],
  templateUrl: './invest-ideas-carousel.component.html',
  styleUrl: './invest-ideas-carousel.component.less'
})
export class InvestIdeasCarouselComponent implements OnInit {
  protected selectedSection: SectionDisplay | null = null;
  sections$!: Observable<SectionDisplay[]>;

  instrumentSelected = output<InstrumentKey>();

  constructor(
    private readonly historyService: HistoryService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.sections$ = new BehaviorSubject<SectionDisplay[]>([
      {
        title: "Искусственный интеллект",
        description: "Финансовые институты ищут способы автоматизировать рутинные процессы и улучшить качество кредитного скоринга, особенно для клиентов с ограниченной кредитной историей. Инвестиции в компанию, создающую ИИ-решение для автоматической обработки кредитных заявок и альтернативного скоринга на основе анализа больших нетрадиционных данных, открывают доступ к большому и недостаточно охваченному рынку. Ключевым преимуществом является способность алгоритма снижать риски и операционные издержки при одновременном увеличении одобренных кредитов для надежных заемщиков.",
        ideas: [
          {
            instrumentKey: {
              symbol: "SBER",
              exchange: "MOEX"
            },
            shortName: "Сбербанк",
            priceInfo$: this.getPriceInfo({symbol: "SBER", exchange: "MOEX"})
          },
          {
            instrumentKey: {
              symbol: "YNDX",
              exchange: "MOEX"
            },
            shortName: "Yandex clA",
            priceInfo$: this.getPriceInfo({symbol: "YNDX", exchange: "MOEX"})
          },
          {
            instrumentKey: {
              symbol: "MTSS",
              exchange: "MOEX"
            },
            shortName: "МТС-ао",
            priceInfo$: this.getPriceInfo({symbol: "MTSS", exchange: "MOEX"})
          },
          {
            instrumentKey: {
              symbol: "RTKM",
              exchange: "MOEX"
            },
            shortName: "Ростел -ао",
            priceInfo$: this.getPriceInfo({symbol: "RTKM", exchange: "MOEX"})
          },
        ]
      },
      {
        title: "Нефть и газ",
        description: "Поиск новых, экономически рентабельных месторождений углеводородов становится все сложнее и дороже, требуя анализа огромных объемов геолого-геофизических данных. Инвестиции в компанию, разрабатывающую платформу на основе ИИ и машинного обучения для интерпретации сейсмических данных и прогнозирования потенциала месторождений, позволят значительно повысить точность и скорость разведки. Ключевое преимущество технологии — существенное снижение рисков сухих скважин и оптимизация затрат на геологоразведку, что напрямую влияет на будущую прибыльность проектов.",
        ideas: [
          {
            instrumentKey: {
              symbol: "NVTK",
              exchange: "MOEX"
            },
            shortName: "Новатэк ао",
            priceInfo$: this.getPriceInfo({symbol: "NVTK", exchange: "MOEX"})
          },
          {
            instrumentKey: {
              symbol: "ROSN",
              exchange: "MOEX"
            },
            shortName: "Роснефть",
            priceInfo$: this.getPriceInfo({symbol: "ROSN", exchange: "MOEX"})
          }
        ]
      }
    ]);
  }

  private getPriceInfo(instrumentKey: InstrumentKey): Observable<InstrumentPrice> {
    return timer(0, 10_000).pipe(
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
