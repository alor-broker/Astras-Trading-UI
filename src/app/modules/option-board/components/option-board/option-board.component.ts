import { Component, OnDestroy, OnInit, input, inject } from '@angular/core';
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {BehaviorSubject, take} from "rxjs";
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {OptionBoardDataContext} from "../../models/option-board-data-context.model";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {map} from "rxjs/operators";
import {RecordContent} from "../../../../store/widgets-local-state/widgets-local-state.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {LetDirective} from '@ngrx/component';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {FormsModule} from '@angular/forms';
import {ViewSelectorComponent} from '../view-selector/view-selector.component';
import {ViewSelectorItemComponent} from '../view-selector-item/view-selector-item.component';
import {AllOptionsComponent} from '../all-options/all-options.component';
import {AllOptionsListViewComponent} from '../all-options-list-view/all-options-list-view.component';
import {SelectedOptionsComponent} from '../selected-options/selected-options.component';
import {OptionBoardChartsLayoutComponent} from '../option-board-charts-layout/option-board-charts-layout.component';
import {AsyncPipe} from '@angular/common';

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
  templateUrl: './option-board.component.html',
  styleUrls: ['./option-board.component.less'],
  imports: [
    TranslocoDirective,
    LetDirective,
    NzSelectComponent,
    FormsModule,
    NzOptionComponent,
    ViewSelectorComponent,
    ViewSelectorItemComponent,
    AllOptionsComponent,
    AllOptionsListViewComponent,
    SelectedOptionsComponent,
    OptionBoardChartsLayoutComponent,
    AsyncPipe
  ]
})
export class OptionBoardComponent implements OnInit, OnDestroy {
  private readonly contextFactory = inject(OptionBoardDataContextFactory);
  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  readonly ComponentTabs = ComponentTabs;
  optionSides = Object.values(OptionSide);
  parameters = Object.values(OptionParameters);
  readonly guid = input.required<string>();

  selectedTab$ = new BehaviorSubject(ComponentTabs.AllOptions);
  dataContext!: OptionBoardDataContext;
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
