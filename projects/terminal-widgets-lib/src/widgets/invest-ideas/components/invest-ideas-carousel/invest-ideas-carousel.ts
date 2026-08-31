import {ChangeDetectionStrategy, Component, inject, model, OnInit, output, ViewEncapsulation} from '@angular/core';
import {Observable, switchMap} from "rxjs";
import {LetDirective} from "@ngrx/component";
import {NzCarouselComponent, NzCarouselContentDirective} from "ng-zorro-antd/carousel";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {map} from "rxjs/operators";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {InvestIdeasService} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {
  IdeaResponse,
  IdeaResponseFormat
} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {IdeaMetrics} from '@terminal-widgets-lib/widgets/invest-ideas/components/idea-metrics/idea-metrics';
import {
  InvestIdeasDetailsDialog
} from '@terminal-widgets-lib/widgets/invest-ideas/components/invest-ideas-details-dialog/invest-ideas-details-dialog';

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
    IdeaMetrics,
    InvestIdeasDetailsDialog
  ],
  templateUrl: './invest-ideas-carousel.html',
  styleUrl: './invest-ideas-carousel.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasCarousel implements OnInit {
  ideas$!: Observable<IdeaResponse[]>;

  instrumentSelected = output<InstrumentKey>();

  protected readonly selectedIdea = model<IdeaResponse | null>(null);
  protected readonly IdeaResponseFormat = IdeaResponseFormat;
  private readonly investIdeasService = inject(InvestIdeasService);
  private readonly translatorService = inject(TranslatorService);
  private readonly applicationStatusService = inject(ApplicationStatusService);
  private readonly refreshInterval = 600_000;

  ngOnInit(): void {
    this.ideas$ = createRefresh(this.refreshInterval, this.applicationStatusService.isActive$).pipe(
      switchMap(() => this.investIdeasService.getIdeas(
        {
          pageNum: 1,
          pageSize: 20
        },
        this.translatorService.getActiveLang()
      )),
      map(response => response?.list ?? [])
    );
  }

  selectSymbol(symbol: InstrumentKey): void {
    this.instrumentSelected.emit(symbol);
    this.selectedIdea.set(null);
  }
}
