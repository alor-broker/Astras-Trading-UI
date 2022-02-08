import { Component, Input, OnInit } from '@angular/core';
import { map, Observable } from 'rxjs';
import { OrderbookService } from '../../services/orderbook.service';

@Component({
  selector: 'ats-orderbook-chart[guid]',
  templateUrl: './orderbook-chart.component.html',
  styleUrls: ['./orderbook-chart.component.less']
})
export class OrderbookChartComponent implements OnInit {
  @Input()
  guid!: string
  view: [number, number] = [700, 300];
  shouldShowChart$?: Observable<boolean>;
  colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  };
  data = [{
    name: "Germany",
    series: [
      {
        name: "1990",
        value: 0
      },
      {
        name: "2010",
        value: 73000
      },
      {
        name: "2011",
        value: 89000
      }
    ]
  },
  {
    "name": "USA",
    "series": [
      {
        "name": "1990",
        "value": 25000
      },
      {
        "name": "2010",
        "value": 30900
      },
      {
        "name": "2011",
        "value": 31100
      }
    ]
  },];

  constructor(private service: OrderbookService) { }

  ngOnInit() {
    this.shouldShowChart$ = this.service.getSettings(this.guid).pipe(
      map(s => s.showChart)
    )
  }

}
