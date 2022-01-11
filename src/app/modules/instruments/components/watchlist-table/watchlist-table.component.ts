import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { WatchedInstrument } from '../../models/watched-instrument.model';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

@Component({
  selector: 'ats-watchlist-table',
  templateUrl: './watchlist-table.component.html',
  styleUrls: ['./watchlist-table.component.sass']
})
export class WatchlistTableComponent implements OnInit {

  watchedInstruments$: Observable<WatchedInstrument[]> = of([])

  constructor(private service: WatchInstrumentsService) { }

  ngOnInit(): void {
    this.watchedInstruments$ = this.service.getWatched();
  }
}
