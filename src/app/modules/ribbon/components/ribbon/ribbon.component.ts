import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  Observable,
  of
} from 'rxjs';
import { IndexDisplay } from '../../models/ribbon-display.model';

@Component({
  selector: 'ats-ribbon[guid]',
  templateUrl: './ribbon.component.html',
  styleUrls: ['./ribbon.component.less']
})
export class RibbonComponent implements OnInit {
  @Input()
  guid!: string;

  indices$!: Observable<IndexDisplay[]>;

  ngOnInit(): void {
    this.indices$ = of([
      {
        name: 'ATX (ATX)',
        value: 3195.70,
        changePercent: 0.82
      },
      {
        name: 'KOSPI (KS11)',
        value: 2512,
        changePercent: 0.87
      },
      {
        name: 'Shanghai Composite (SSEC)',
        value: 3315.3,
        changePercent: -0.37
      },
      {
        name: 'РТС',
        value: 3983.86,
        changePercent: 0.96
      },
      {
        name: 'DAX',
        value: 15597.89,
        changePercent: 0.5
      }
    ]);
  }
}
