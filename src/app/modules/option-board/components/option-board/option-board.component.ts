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
  Observable,
  shareReplay
} from "rxjs";
import { OptionBoardDataContextFactory } from "../../utils/option-board-data-context-factory";
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { BoardView } from "../../models/option-board-layout.model";
import { map } from "rxjs/operators";
import { RecordContent } from "../../../../store/widgets-local-state/widgets-local-state.model";

enum ComponentTabs {
  AllOptions = 'allOptions',
  SelectedOptions = 'selectedOptions',
  Charts = 'charts'
}

interface BoardViewRecord extends RecordContent {
  boardView: BoardView;
}

@Component({
  selector: 'ats-option-board',
  templateUrl: './option-board.component.html',
  styleUrls: ['./option-board.component.less'],
})
export class OptionBoardComponent implements OnInit, OnDestroy {
  private readonly BoardViewStorageKey = 'board-view';
  componentTabs = ComponentTabs;
  tabs = ComponentTabs;
  optionSides = Object.values(OptionSide);
  parameters = Object.values(OptionParameters);

  @Input({required: true})
  guid!: string;

  selectedTab$ = new BehaviorSubject(ComponentTabs.AllOptions);
  dataContext!: OptionBoardDataContext;

  boardView$!: Observable<BoardView>;
  BoardViewValues = BoardView;

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

    this.boardView$ = this.widgetLocalStateService.getStateRecord<BoardViewRecord>(
      this.guid,
      this.BoardViewStorageKey
    ).pipe(
      map(result => result?.boardView ?? BoardView.VerticalTable),
      shareReplay({ bufferSize:1, refCount: true})
    );
  }

  protected selectTab(tab: ComponentTabs): void {
    this.selectedTab$.next(tab);
  }

  protected changeBoardView(view: BoardView): void {
    this.widgetLocalStateService.setStateRecord<BoardViewRecord>(
      this.guid,
      this.BoardViewStorageKey,
      {
        boardView: view
      },
      true
    );
  }
}
