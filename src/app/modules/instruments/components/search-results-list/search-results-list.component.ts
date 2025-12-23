import { ChangeDetectionStrategy, Component, OnInit, input, inject } from '@angular/core';
import { SearchResultItem } from "../../utils/search-instrument-store";
import {
  NzColDirective,
  NzRowDirective
} from "ng-zorro-antd/grid";
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport
} from "@angular/cdk/scrolling";
import { TruncatedTextComponent } from "../../../../shared/components/truncated-text/truncated-text.component";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import {
  combineLatest,
  Observable
} from "rxjs";
import { NzButtonComponent } from "ng-zorro-antd/button";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { map } from "rxjs/operators";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { InstrumentBadgeDisplayComponent } from "../../../../shared/components/instrument-badge-display/instrument-badge-display.component";
import { LetDirective } from "@ngrx/component";
import {
  NzDropDownDirective,
  NzDropdownMenuComponent
} from "ng-zorro-antd/dropdown";
import {
  NzMenuDirective,
  NzMenuItemComponent
} from "ng-zorro-antd/menu";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";
import { TranslocoDirective } from "@jsverse/transloco";

@Component({
    selector: 'ats-search-results-list',
    imports: [
        NzRowDirective,
        NzColDirective,
        CdkVirtualScrollViewport,
        CdkVirtualForOf,
        CdkFixedSizeVirtualScroll,
        TruncatedTextComponent,
        NzButtonComponent,
        NzIconDirective,
        InstrumentBadgeDisplayComponent,
        LetDirective,
        NzDropDownDirective,
        NzDropdownMenuComponent,
        NzMenuDirective,
        NzMenuItemComponent,
        NzTooltipDirective,
        TranslocoDirective
    ],
    templateUrl: './search-results-list.component.html',
    styleUrl: './search-results-list.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsListComponent implements OnInit {
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);

  readonly items = input.required<SearchResultItem[]>();

  readonly itemSize = input(40);

  readonly height = input(200);

  availableInstrumentGroups$!: Observable<string[]>;

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
          return [defaultBadgeColor];
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
      targetGroup ?? defaultBadgeColor
    );
  }
}
