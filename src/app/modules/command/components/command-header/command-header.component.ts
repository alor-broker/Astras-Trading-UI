import { Component, Input, OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Quote } from 'src/app/shared/models/quotes/quote.model';
import { QuotesService } from 'src/app/shared/services/quotes.service';

@Component({
  selector: 'ats-command-header[symbol][exchange]',
  templateUrl: './command-header.component.html',
  styleUrls: ['./command-header.component.sass']
})
export class CommandHeaderComponent implements OnInit {
  @Input()
  symbol = ''
  @Input()
  exchange = ''
  @Input()
  instrumentGroup: string = ''

  quote$: Observable<Quote | null> = of(null)

  constructor(private quoteService: QuotesService) { }

  ngOnInit(): void {
    this.quote$ = this.quoteService.getQuotes(this.symbol, this.exchange, this.instrumentGroup)
  }

}
