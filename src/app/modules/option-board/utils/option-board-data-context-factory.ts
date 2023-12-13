import {Injectable} from "@angular/core";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {BehaviorSubject, combineLatest, Observable, shareReplay, take} from "rxjs";
import {Option, OptionParameters, OptionSide, UnderlyingAsset} from "../models/option-board.model";
import {OptionBoardDataContext, OptionsSelection} from "../models/option-board-data-context.model";
import {OptionBoardSettings} from "../models/option-board-settings.model";
import {map} from "rxjs/operators";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";

@Injectable({
  providedIn: 'root'
})
export class OptionBoardDataContextFactory {
  constructor(private readonly widgetSettingsService: WidgetSettingsService) {

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

      destroy(): void {
        this.selectedSide$.complete();
        this.selectedParameter$.complete();
      },

      updateOptionSelection(option: Option, underlyingAsset: UnderlyingAsset): void {
        factory.updateOptionSelection(option, underlyingAsset, this);
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

  private updateOptionSelection(option: Option, underlyingAsset: UnderlyingAsset, context: OptionBoardDataContext): void {
    combineLatest([
      context.settings$,
      context.optionsSelection$
    ]).pipe(
      take(1)
    ).subscribe(([settings, currentSelection]) => {
      let currentSelectionForInstrument = currentSelection.find(x => this.filterSelection(x, settings));

      if (!currentSelectionForInstrument) {
        currentSelectionForInstrument = {
          instrument: underlyingAsset,
          selectedOptions: []
        };
      }

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
