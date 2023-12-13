import {Observable, Subject} from "rxjs";
import {Option, OptionKey, OptionParameters, OptionSide, UnderlyingAsset} from "./option-board.model";
import {OptionBoardSettings} from "./option-board-settings.model";

export interface OptionsSelection {
  instrument: UnderlyingAsset;
  selectedOptions: OptionKey[];
}

export interface OptionBoardDataContext {
  readonly selectedSide$: Subject<OptionSide>;
  readonly selectedParameter$: Subject<OptionParameters>;
  readonly optionsSelection$: Subject<OptionsSelection[]>;
  readonly currentSelection$: Observable<OptionsSelection>;

  readonly settings$: Observable<OptionBoardSettings>;

  destroy(): void;

  updateOptionSelection(option: Option, underlyingAsset: UnderlyingAsset): void;

  removeItemFromSelection(symbol: string): void;

  clearCurrentSelection(): void;
}
