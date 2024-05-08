import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {BehaviorSubject} from "rxjs";
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {OptionBoardDataContext} from "../../models/option-board-data-context.model";

enum ComponentTabs {
  AllOptions = 'allOptions',
  SelectedOptions = 'selectedOptions',
  Charts = 'charts'
}

@Component({
  selector: 'ats-option-board',
  templateUrl: './option-board.component.html',
  styleUrls: ['./option-board.component.less'],
})
export class OptionBoardComponent implements OnInit, OnDestroy {
  componentTabs = ComponentTabs;
  tabs = ComponentTabs;
  optionSides = Object.values(OptionSide);
  parameters = Object.values(OptionParameters);

  @Input({required: true})
  guid!: string;

  selectedTab$ = new BehaviorSubject(ComponentTabs.AllOptions);
  dataContext!: OptionBoardDataContext;

  constructor(
    private readonly contextFactory: OptionBoardDataContextFactory
  ) {
  }

  ngOnDestroy(): void {
    this.selectedTab$.complete();
    this.dataContext.destroy();
  }

  ngOnInit(): void {
    this.dataContext = this.contextFactory.create(this.guid);
  }

  selectTab(tab: ComponentTabs): void {
    this.selectedTab$.next(tab);
  }
}
