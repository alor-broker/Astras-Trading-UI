import {
  Observable,
  Subject
} from "rxjs";
import {
  OptionKey,
  OptionParameters,
  OptionSide,
  UnderlyingAsset
} from "./option-board.types";
import {OptionBoardWidgetSettings} from '@terminal-widgets-lib/widgets/option-board/widget-settings.types';

export interface OptionsSelection {
  instrument: UnderlyingAsset;
  selectedOptions: OptionKey[];
}

export interface SelectionParameters {
  quantity: number;
}

export interface OptionBoardDataContext {
  readonly selectedSide$: Subject<OptionSide>;
  readonly selectedParameter$: Subject<OptionParameters>;
  readonly optionsSelection$: Subject<OptionsSelection[]>;
  readonly currentSelection$: Observable<OptionsSelection>;
  readonly selectionParameters$: Subject<Map<string, Partial<SelectionParameters>>>;

  readonly settings$: Observable<OptionBoardWidgetSettings>;

  destroy(): void;

  updateOptionSelection(option: OptionKey, underlyingAsset: UnderlyingAsset): void;

  setParameters(option: OptionKey, parameters: Partial<SelectionParameters>): void;

  removeItemFromSelection(symbol: string): void;

  clearCurrentSelection(): void;
}
