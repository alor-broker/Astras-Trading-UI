import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Position } from 'src/app/shared/models/positions/position.model';
import { BlotterSettings } from 'src/app/shared/models/settings/blotter-settings.model';
import { Widget } from 'src/app/shared/models/widget.model';
import { BlotterService } from 'src/app/shared/services/blotter.service';
import { PositionFilter } from '../../models/position-filter.model';

@Component({
  selector: 'ats-positions[shouldShowSettings][widget][settings]',
  templateUrl: './positions.component.html',
  styleUrls: ['./positions.component.less']
})
export class PositionsComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  widget!: Widget<BlotterSettings>;
  @Input('settings') set settings(settings: BlotterSettings) { this.settings$.next(settings); };
  private settings$ = new BehaviorSubject<BlotterSettings | null>(null);
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  private positions$: Observable<Position[]> = of([]);
  displayPositions$: Observable<Position[]> = of([]);
  maxVolume: number = 1;
  searchFilter = new BehaviorSubject<PositionFilter>({
    shortNameMenuVisible: false,
    symbolMenuVisible: false
  });

  constructor(private service: BlotterService) { }

  ngOnInit(): void {
    this.positions$ = this.service.getPositions();
    this.displayPositions$ = this.positions$.pipe(
      mergeMap(poses => this.searchFilter.pipe(
        map(f => poses.filter(p => this.justifyFilter(p, f)))
      )),
    )
  }

  reset(): void {
    this.searchFilter.next({
      shortNameMenuVisible: false,
      symbolMenuVisible: false
    });
  }

  filterChange(text: string, option: 'symbol' | 'shortName' ) {
    const newFilter = this.searchFilter.getValue();
    newFilter[option] = text;
    this.searchFilter.next(newFilter)
  }

  getFilter() {
    return this.searchFilter.getValue();
  }

  private justifyFilter(position: Position, filter: PositionFilter) : boolean {
    if (filter.symbol) {
      return position.symbol.toLowerCase().includes(filter.symbol.toLowerCase());
    }
    if (filter.shortName) {
      return position.shortName.toLowerCase().includes(filter.shortName.toLowerCase());
    }
    return true;
  }
}
