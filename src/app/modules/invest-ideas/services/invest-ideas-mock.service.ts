import { InvestIdeasService } from "./invest-ideas.service";
import {
  Idea,
  IdeasPagedResponse,
  Page
} from "./invest-ideas-service-typings";
import {
  Observable,
  of
} from "rxjs";
import { Injectable } from "@angular/core";

@Injectable()
export class InvestIdeasMockService extends InvestIdeasService {
  override getIdeasInternal(page: Page): Observable<IdeasPagedResponse | null> {
    const tickers = 'MOEX:GAZP:TQBR;MOEX:AKRN:TQBR;MOEX:VTBR:TQBR;MOEX:NLMK:TQBR;MOEX:RUAL:TQBR;MOEX:TATNP:TQBR;MOEX:TATN:TQBR;MOEX:PHOR:TQBR;MOEX:SNGSP:TQBR;MOEX:SNGS:TQBR;MOEX:PLZL:TQBR;MOEX:SIBN:TQBR;MOEX:LKOH:TQBR;MOEX:GMKN:TQBR;MOEX:NVTK:TQBR;MOEX:SBERP:TQBR;MOEX:SBER:TQBR;MOEX:ROSN:TQBR;MOEX:VSMO:TQBR;MOEX:CHMF:TQBR'
      .split(';')
      .map(t => {
        const parts = t.split(':');
        return {exchange: parts[0], ticker: parts[1], instrumentGroup: parts[2]};
      });

    const GEN_COUNT = 300;
    const TOTAL_PAGES = Math.ceil(GEN_COUNT / page.pageSize);
    const ideas = Array.from(Array(GEN_COUNT).keys()).map(i => {
      const num = i + 1;
      const symbolsCount = Math.floor(Math.random() * 5) + 1;
      const usedSymbolIndex = new Set<number>();
      const getIndex = (): number => {
        while (true) {
          const tickerIndex = Math.ceil(Math.random() * tickers.length) % tickers.length;
          if (!usedSymbolIndex.has(tickerIndex)) {
            usedSymbolIndex.add(tickerIndex);
            return tickerIndex;
          }
        }
      };

      const ideaSymbols = Array.from(Array(symbolsCount).keys()).map(() => {
        const ticker = tickers[getIndex()];
        return {ticker: ticker.ticker, exchange: ticker.exchange};
      });

      const bodyLength = Math.floor(Math.random() * (500 - 20 + 1)) + 20;
      const body = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(5).substring(0, bodyLength);

      return {
        title: `idea ${num}`,
        body: body,
        symbols: ideaSymbols
      } as Idea;
    });

    const startIndex = (page.pageNum - 1) * page.pageSize;
    const croppedIdeas = ideas.slice(startIndex, startIndex + page.pageSize);

    return of({
      list: croppedIdeas,
      currentPage: page.pageNum,
      totalPages: TOTAL_PAGES,
      pageSize: page.pageSize,
      totalCount: GEN_COUNT,
      hasPrevious: page.pageNum > 1,
      hasNext: page.pageNum < TOTAL_PAGES
    });
  }
}
