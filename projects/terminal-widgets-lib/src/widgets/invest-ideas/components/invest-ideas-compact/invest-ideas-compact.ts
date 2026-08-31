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
import {NzCarouselComponent, NzCarouselContentDirective} from "ng-zorro-antd/carousel";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {NzSkeletonComponent} from "ng-zorro-antd/skeleton";
import {NzTypographyComponent} from "ng-zorro-antd/typography";
import {fromEvent, Observable, switchMap} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {InvestIdeasService} from "../../services/invest-ideas.service";
import {map} from "rxjs/operators";
import {TranslocoDirective} from "@jsverse/transloco";
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {createRefresh} from '@terminal-core-lib/common/utils/observable/create-refresh';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {IdeaDetails} from '@terminal-widgets-lib/widgets/invest-ideas/components/idea-details/idea-details';
import {
  IdeaResponse,
  IdeaResponseFormat
} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas-service.types';
import {IdeaMetrics} from '@terminal-widgets-lib/widgets/invest-ideas/components/idea-metrics/idea-metrics';

@Component({
  selector: 'ats-invest-ideas-compact',
  imports: [
    LetDirective,
    NzCarouselComponent,
    NzCarouselContentDirective,
    NzEmptyComponent,
    NzSkeletonComponent,
    NzTypographyComponent,
    TranslocoDirective,
    InstrumentIcon,
    IdeaDetails,
    IdeaMetrics
  ],
  templateUrl: './invest-ideas-compact.html',
  styleUrl: './invest-ideas-compact.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class InvestIdeasCompact implements OnInit {
  ideas$!: Observable<IdeaResponse[]>;

  protected readonly selectedIdea = model<IdeaResponse | null>(null);

  protected readonly isLoading = signal<boolean>(false);
  protected readonly IdeaResponseFormat = IdeaResponseFormat;
  private readonly investIdeasService = inject(InvestIdeasService);
  private readonly translatorService = inject(TranslatorService);
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
          pageSize: 20
        },
        this.translatorService.getActiveLang()
      )),
      map(response => response?.list ?? [])
    );
  }

  openIdea(idea: IdeaResponse): void {
    this.selectedIdea.set(idea);
  }
}
