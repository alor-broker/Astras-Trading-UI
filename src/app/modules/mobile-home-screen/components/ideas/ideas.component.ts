import {
  Component,
  model,
  OnInit,
  output
} from '@angular/core';
import { NzSkeletonComponent } from "ng-zorro-antd/skeleton";
import {
  BehaviorSubject,
  Observable
} from "rxjs";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzCarouselComponent,
  NzCarouselContentDirective
} from "ng-zorro-antd/carousel";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { InstrumentIconComponent } from "../../../../shared/components/instrument-icon/instrument-icon.component";
import { Section } from "../../models/ideas-typings.model";
import { IdeasSectionDetailsComponent } from "../ideas-section-details/ideas-section-details.component";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";

@Component({
  selector: 'ats-ideas',
  imports: [
    NzSkeletonComponent,
    LetDirective,
    NzEmptyComponent,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzTypographyComponent,
    InstrumentIconComponent,
    IdeasSectionDetailsComponent
  ],
  templateUrl: './ideas.component.html',
  styleUrl: './ideas.component.less'
})
export class IdeasComponent implements OnInit {
  sections$!: Observable<Section[]>;

  protected selectedSection = model<Section | null>(null);

  readonly instrumentSelected = output<InstrumentKey>();

  selectInstrument(instrumentKey: InstrumentKey): void {
    this.instrumentSelected.emit(instrumentKey);
    this.selectedSection.set(null);
  }

  ngOnInit(): void {
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
