import {
  Component,
  DestroyRef,
  model,
  OnInit
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
  BehaviorSubject,
  fromEvent,
  Observable
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Section } from "../../models/ideas-typings.model";
import { IdeasSectionDetailsComponent } from "../ideas-section-details/ideas-section-details.component";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";

@Component({
  selector: 'ats-invest-ideas-compact',
  imports: [
    IdeasSectionDetailsComponent,
    InstrumentIconComponent,
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent
  ],
  templateUrl: './invest-ideas-compact.component.html',
  styleUrl: './invest-ideas-compact.component.less'
})
export class InvestIdeasCompactComponent implements OnInit {
  sections$!: Observable<Section[]>;

  protected selectedSection = model<Section | null>(null);

  constructor(private readonly destroyRef: DestroyRef) {
  }

  ngOnInit(): void {
    fromEvent(window, 'popstate').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.selectedSection.set(null);
    });

    this.sections$ = new BehaviorSubject<Section[]>([
      {
        title: "Искусственный интеллект",
        description: "Финансовые институты ищут способы автоматизировать рутинные процессы и улучшить качество кредитного скоринга, особенно для клиентов с ограниченной кредитной историей. Инвестиции в компанию, создающую ИИ-решение для автоматической обработки кредитных заявок и альтернативного скоринга на основе анализа больших нетрадиционных данных, открывают доступ к большому и недостаточно охваченному рынку. Ключевым преимуществом является способность алгоритма снижать риски и операционные издержки при одновременном увеличении одобренных кредитов для надежных заемщиков.",
        ideas: [
          {
            instrumentKey: {
              symbol: "SBER",
              exchange: "MOEX"
            },
            shortName: "Сбербанк"
          },
          {
            instrumentKey: {
              symbol: "YNDX",
              exchange: "MOEX"
            },
            shortName: "Yandex clA"
          },
          {
            instrumentKey: {
              symbol: "MTSS",
              exchange: "MOEX"
            },
            shortName: "МТС-ао"
          },
          {
            instrumentKey: {
              symbol: "RTKM",
              exchange: "MOEX"
            },
            shortName: "Ростел -ао"
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
            shortName: "Новатэк ао"
          },
          {
            instrumentKey: {
              symbol: "ROSN",
              exchange: "MOEX"
            },
            shortName: "Роснефть"
          }
        ]
      }
    ]);
  }

  openSection(section: Section): void {
    this.selectedSection.set(section);
  }
}
