import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { InstrumentAdditions } from '../../models/instrument-additions.model';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.less']
})
export class WatchlistTableComponent implements OnInit {

  watchedInstruments$: Observable<WatchedInstrument[]> = of([])

  constructor(private service: WatchInstrumentsService, private sync: SyncService) { }

  ngOnInit(): void {
    this.watchedInstruments$ = this.service.getWatched();
  }

  makeActive(instr: InstrumentKey) {
    this.sync.selectNewInstrument({
      symbol: instr.symbol,
      exchange: instr.exchange,
      instrumentGroup: instr.instrumentGroup
    });
  }

  remove(instr: InstrumentKey) {
    this.service.remove(instr);
  }
}
