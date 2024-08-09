import { ThemeType } from "../../../shared/models/settings/theme-settings.model";
import { IChartingLibraryWidget } from "../../../../assets/charting_library";
import { InstrumentSearchService } from "../services/instrument-search.service";
import { filter, Observable } from "rxjs";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { SyntheticInstrumentsHelper } from "./synthetic-instruments.helper";
import { DestroyRef } from "@angular/core";

export class SearchButtonHelper {
  static create(
    chartWidget: IChartingLibraryWidget,
    instrumentSearchService: InstrumentSearchService,
    activeInstrument$: Observable<Instrument>,
    themeType: ThemeType,
    destroyRef: DestroyRef
  ): void {
    const searchBtn = chartWidget.createButton({
      align: 'left',
      useTradingViewStyle: false
    });

    searchBtn.style.maxWidth = '100px';
    searchBtn.style.padding = '8px 8px 9px 8px';
    searchBtn.style.borderRadius = '4px';
    searchBtn.style.fontWeight = '600';
    searchBtn.style.overflow = 'hidden';
    searchBtn.style.textOverflow = 'ellipsis';
    searchBtn.style.cursor = 'pointer';

    searchBtn.addEventListener('click', () => {
      instrumentSearchService.openModal({ value: chartWidget.activeChart().symbol() ?? null });
    });

    searchBtn.addEventListener('mouseenter', () => {
      searchBtn.style.backgroundColor = themeType === ThemeType.dark ? '#2a2e39' : '#f0f3fa';
    });

    searchBtn.addEventListener('mouseleave', () => {
      searchBtn.style.backgroundColor = 'transparent';
    });

    const searchBtnParentEl = searchBtn.parentElement!.parentElement!;
    searchBtnParentEl.nextElementSibling!.remove();
    searchBtnParentEl.parentElement!.prepend(searchBtnParentEl);

    instrumentSearchService.modalData$.pipe(
      filter(i => i != null),
      takeUntilDestroyed(destroyRef)
    )
      .subscribe(i => {
          if (i == null) {
            return;
          }
          chartWidget.activeChart().setSymbol(i);
        }
      );

    activeInstrument$.subscribe(instrument => {
        const instrumentStr = SyntheticInstrumentsHelper.isSyntheticInstrument(instrument.symbol)
          ? instrument.symbol
          : instrument.shortName;

        searchBtn.innerText = instrumentStr;
        searchBtn.setAttribute('data-tooltip', instrumentStr);
      });
  }
}
