import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  take
} from "rxjs";
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {map} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {FormsModule} from '@angular/forms';
import {AsyncPipe} from '@angular/common';
import {RecordContent} from '@terminal-core-lib/features/widget-local-state/widget-local-state.types';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {
  OptionParameters,
  OptionSide
} from '@terminal-widgets-lib/widgets/option-board/types/option-board.types';
import {OptionBoardDataContext} from '@terminal-widgets-lib/widgets/option-board/types/option-board-data-context.types';
import {ViewSelector} from '@terminal-widgets-lib/widgets/option-board/components/view-selector/view-selector';
import {ViewSelectorItem} from '@terminal-widgets-lib/widgets/option-board/components/view-selector-item/view-selector-item';
import {AllOptions} from '@terminal-widgets-lib/widgets/option-board/components/all-options/all-options';
import {AllOptionsListView} from '@terminal-widgets-lib/widgets/option-board/components/all-options-list-view/all-options-list-view';
import {SelectedOptions} from '@terminal-widgets-lib/widgets/option-board/components/selected-options/selected-options';
import {OptionBoardChartsLayout} from '@terminal-widgets-lib/widgets/option-board/components/option-board-charts-layout/option-board-charts-layout';

enum ComponentTabs {
  AllOptions = 'allOptions',
  OptionsByExpiration = 'allOptionsByExpiration',
  SelectedOptions = 'selectedOptions',
  Charts = 'charts'
}

interface BoardViewRecord extends RecordContent {
  boardView: string;
}

@Component({
  selector: 'ats-option-board',
  templateUrl: './option-board.html',
  styleUrls: ['./option-board.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzSelectComponent,
    FormsModule,
    NzOptionComponent,
    AsyncPipe,
    ViewSelector,
    ViewSelectorItem,
    AllOptions,
    AllOptionsListView,
    SelectedOptions,
    OptionBoardChartsLayout
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OptionBoard implements OnInit, OnDestroy {
  readonly ComponentTabs = ComponentTabs;

  optionSides = Object.values(OptionSide);

  parameters = Object.values(OptionParameters);

  readonly guid = input.required<string>();

  selectedTab$ = new BehaviorSubject(ComponentTabs.AllOptions);

  dataContext!: OptionBoardDataContext;

  private readonly contextFactory = inject(OptionBoardDataContextFactory);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly BoardViewStorageKey = 'board-view';

  ngOnDestroy(): void {
    this.selectedTab$.complete();
    this.dataContext.destroy();
  }

  ngOnInit(): void {
    this.dataContext = this.contextFactory.create(this.guid());

    this.widgetLocalStateService.getStateRecord<BoardViewRecord>(
      this.guid(),
      this.BoardViewStorageKey
    ).pipe(
      take(1),
      map(result => result?.boardView ?? ComponentTabs.AllOptions)
    ).subscribe(view => {
      this.selectTab(view);
    });
  }

  protected selectTab(tab: string): void {
    this.selectedTab$.next(tab as ComponentTabs);

    if ([ComponentTabs.AllOptions, ComponentTabs.OptionsByExpiration].includes(tab as ComponentTabs)) {
      this.widgetLocalStateService.setStateRecord<BoardViewRecord>(
        this.guid(),
        this.BoardViewStorageKey,
        {
          boardView: tab
        },
        true
      );
    }
  }
}
