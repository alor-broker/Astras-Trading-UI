import { Injectable, inject } from "@angular/core";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  OptionKey,
  OptionParameters,
  OptionSide,
  UnderlyingAsset
} from "../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../models/option-board-data-context.model";
import { OptionBoardSettings } from "../models/option-board-settings.model";
import { map } from "rxjs/operators";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class OptionBoardDataContextFactory {
  private readonly widgetSettingsService = inject(WidgetSettingsService);

  static getParametersKey(option: OptionKey): string {
    return `${option.exchange}:${option.symbol}`;
  }

  create(widgetGuid: string): OptionBoardDataContext {
    const settings$ = this.widgetSettingsService.getSettings<OptionBoardSettings>(widgetGuid).pipe(
      shareReplay(1)
    );

    const selectedSide$ = new BehaviorSubject<OptionSide>(OptionSide.Call);
    const optionsSelection$ = new BehaviorSubject<OptionsSelection[]>([]);
    const currentSelection$ = this.getCurrentSelection(settings$, optionsSelection$);

    const factory = this;

    return {
      settings$,
      selectedSide$,
      selectedParameter$: new BehaviorSubject<OptionParameters>(OptionParameters.Price),
      optionsSelection$,
      currentSelection$: currentSelection$,
      selectionParameters$: new BehaviorSubject(new Map<string, Partial<SelectionParameters>>()),

      destroy(): void {
        this.selectedSide$.complete();
        this.optionsSelection$.complete();
        this.selectedParameter$.complete();
        this.selectionParameters$.complete();
      },

      updateOptionSelection(option: OptionKey, underlyingAsset: UnderlyingAsset): void {
        factory.updateOptionSelection(option, underlyingAsset, this);
      },

      setParameters(option: OptionKey, parameters: Partial<SelectionParameters>): void {
        factory.setParameters(option, parameters, this);
      },

      removeItemFromSelection(symbol: string): void {
        factory.removeItemFromSelection(symbol, this);
      },

      clearCurrentSelection(): void {
        factory.clearCurrentSelection(this);
      }
    };
  }

  private getCurrentSelection(
    settings$: Observable<OptionBoardSettings>,
    optionsSelection$: Observable<OptionsSelection[]>
  ): Observable<OptionsSelection> {
    return combineLatest([
      settings$,
      optionsSelection$
    ]).pipe(
      map(([settings, selection]) => {
        return selection.find(x => this.filterSelection(x, settings))
          ?? {
            instrument: {
              symbol: settings.symbol,
              exchange: settings.exchange
            } as UnderlyingAsset,
            selectedOptions: []
          };
      }),
      shareReplay(1)
    );
  }

  private updateOptionSelection(option: OptionKey, underlyingAsset: UnderlyingAsset, context: OptionBoardDataContext): void {
    combineLatest([
      context.settings$,
      context.optionsSelection$
    ]).pipe(
      take(1)
    ).subscribe(([settings, currentSelection]) => {
      let currentSelectionForInstrument = currentSelection.find(x => this.filterSelection(x, settings));

      currentSelectionForInstrument = {
        instrument: currentSelectionForInstrument?.instrument ?? underlyingAsset,
        selectedOptions: currentSelectionForInstrument?.selectedOptions ?? []
      };

      const currentOptionSelection = currentSelectionForInstrument.selectedOptions.find(x => x.symbol === option.symbol);
      if (!!currentOptionSelection) {
        currentSelectionForInstrument.selectedOptions = [
          ...currentSelectionForInstrument.selectedOptions.filter(x => x.symbol !== option.symbol)
        ];
      } else {
        currentSelectionForInstrument.selectedOptions = [
          ...currentSelectionForInstrument.selectedOptions,
          option
        ];
      }

      context.optionsSelection$.next([
        ...currentSelection.filter(x => !this.filterSelection(x, currentSelectionForInstrument!.instrument)),
        currentSelectionForInstrument
      ]);
    });
  }

  private setParameters(option: OptionKey, parameters: Partial<SelectionParameters>, context: OptionBoardDataContext): void {
    context.selectionParameters$.pipe(
      take(1)
    ).subscribe(currentParameters => {
      const key = OptionBoardDataContextFactory.getParametersKey(option);

      const updatedParameters = {
        ...currentParameters.get(key),
        ...parameters
      };

      currentParameters.set(key, updatedParameters);

      context.selectionParameters$.next(currentParameters);
    });
  }

  private removeItemFromSelection(symbol: string, context: OptionBoardDataContext): void {
    combineLatest([
      context.settings$,
      context.optionsSelection$
    ]).pipe(
      take(1)
    ).subscribe(([settings, selection]) => {
      const currentSelectionForInstrument = selection.find(x => this.filterSelection(x, settings))!;

      currentSelectionForInstrument.selectedOptions = currentSelectionForInstrument.selectedOptions.filter(x => x.symbol !== symbol);

      context.optionsSelection$.next([
        ...selection.filter(x => !this.filterSelection(x, currentSelectionForInstrument.instrument)),
        currentSelectionForInstrument
      ]);
    });
  }

  private clearCurrentSelection(context: OptionBoardDataContext): void {
    combineLatest([
      context.settings$,
      context.optionsSelection$
    ]).pipe(
      take(1)
    ).subscribe(([settings, selection]) => {
      context.optionsSelection$.next([
        ...selection.filter(x => !this.filterSelection(x, settings))
      ]);
    });
  }

  private filterSelection(selection: OptionsSelection, instrumentKey: InstrumentKey): boolean {
    return selection.instrument.symbol === instrumentKey.symbol
      && selection.instrument.exchange === instrumentKey.exchange;
  }
}
