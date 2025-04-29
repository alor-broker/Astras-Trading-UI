import { Component } from '@angular/core';
import { OrderbookTableBaseComponent } from "../orderbook-table-base.component";

@Component({
    selector: 'ats-orderbook-table-volumes-at-the-edges[guid]',
    templateUrl: './orderbook-table-volumes-at-the-edges.component.html',
    styleUrls: ['../orderbook-table-base.component.less'],
    standalone: false
})
export class OrderbookTableVolumesAtTheEdgesComponent extends OrderbookTableBaseComponent {

}
