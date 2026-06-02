import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport
} from "@angular/cdk/scrolling";
import {
  combineLatest,
  Observable
} from "rxjs";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {map} from "rxjs/operators";
import {LetDirective} from "@ngrx/component";
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {TranslocoDirective} from "@jsverse/transloco";
import {TerminalSettingsService} from '../../../terminal-settings/services/terminal-settings.service';
import {DesktopDashboardContextService} from '../../../dashboard/desktop/services/desktop-dashboard-context.service';
import {SearchResultItem} from '../../utils/search-instrument-store';
import {DefaultBadge} from '../../../instruments/constants/badges.constants';
import {InstrumentKey} from '../../../../common/types/instrument.types';
import {TruncatedTextComponent} from '../../../../common/components/truncated-text/truncated-text';
import {InstrumentBadgeDisplay} from '../../../../common/components/instrument-badge-display/instrument-badge-display';

@Component({
  selector: 'ats-search-results-list',
  imports: [
    NzRowDirective,
    NzColDirective,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    NzButtonComponent,
    NzIconDirective,
    LetDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzTooltipDirective,
    TranslocoDirective,
    NzDropdownDirective,
    TruncatedTextComponent,
    InstrumentBadgeDisplay
  ],
  templateUrl: './search-results-list.html',
  styleUrl: './search-results-list.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsList implements OnInit {
  readonly items = input.required<SearchResultItem[]>();

  readonly itemSize = input(40);

  readonly height = input(200);

  availableInstrumentGroups$!: Observable<string[]>;

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  ngOnInit(): void {
    const isBadgesEnabled$ = this.terminalSettingsService.getSettings().pipe(
      map(s => s.badgesBind ?? false)
    );

    this.availableInstrumentGroups$ = combineLatest({
      isBadgesEnabled: isBadgesEnabled$,
      currentInstrumentsSelection: this.dashboardContextService.instrumentsSelection$
    }).pipe(
      map(x => {
        if (x.isBadgesEnabled) {
          return Object.keys(x.currentInstrumentsSelection);
        } else {
          return [DefaultBadge];
        }
      })
    );
  }

  trackByFn(index: number, item: SearchResultItem): string {
    return `${item.symbol}_${item.exchange}_${item.board}`;
  }

  toInstrumentKey(item: SearchResultItem): InstrumentKey {
    return {
      symbol: item.symbol,
      exchange: item.exchange,
      instrumentGroup: item.board
    };
  }

  selectItem(item: SearchResultItem, targetGroup: string | null): void {
    this.dashboardContextService.selectDashboardInstrument(
      this.toInstrumentKey(item),
      targetGroup ?? DefaultBadge
    );
  }
}
