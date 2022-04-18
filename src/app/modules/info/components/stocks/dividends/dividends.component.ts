import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Dividend } from '../../../models/dividend.model';
import { InfoService } from '../../../services/info.service';

@Component({
  selector: 'ats-dividends',
  templateUrl: './dividends.component.html',
  styleUrls: ['./dividends.component.less']
})
export class DividendsComponent implements OnInit {
  @Input()
  guid!: string

  dividends$?: Observable<Dividend[]>;

  constructor(private service: InfoService) { }

  ngOnInit(): void {
    this.dividends$ = this.service.getDividends().pipe(map(divs => divs.reverse()));
  }
}
