import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  OptionParameters,
  OptionSide
} from "../../models/option-board.model";
import {
  BehaviorSubject,
  take
} from "rxjs";
import { OptionBoardDataContextFactory } from "../../utils/option-board-data-context-factory";
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { map } from "rxjs/operators";
import { RecordContent } from "../../../../store/widgets-local-state/widgets-local-state.model";

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
})
export class OptionBoardComponent implements OnInit, OnDestroy {
  private readonly BoardViewStorageKey = 'board-view';
  readonly ComponentTabs = ComponentTabs;
  optionSides = Object.values(OptionSide);
  parameters = Object.values(OptionParameters);

  @Input({required: true})
  guid!: string;

  selectedTab$ = new BehaviorSubject(ComponentTabs.AllOptions);
  dataContext!: OptionBoardDataContext;

  constructor(
    private readonly contextFactory: OptionBoardDataContextFactory,
    private readonly widgetLocalStateService: WidgetLocalStateService
  ) {
  }

  ngOnDestroy(): void {
    this.selectedTab$.complete();
    this.dataContext.destroy();
  }

  ngOnInit(): void {
    this.dataContext = this.contextFactory.create(this.guid);

    this.widgetLocalStateService.getStateRecord<BoardViewRecord>(
      this.guid,
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

    if([ComponentTabs.AllOptions, ComponentTabs.OptionsByExpiration].includes(tab as ComponentTabs)) {
      this.widgetLocalStateService.setStateRecord<BoardViewRecord>(
        this.guid,
        this.BoardViewStorageKey,
        {
          boardView: tab
        },
        true
      );
    }
  }
}
