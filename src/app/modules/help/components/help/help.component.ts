import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HelpResponse } from '../../models/help-response.model';
import { HelpService } from '../../services/help.service';

@Component({
  selector: 'ats-help[name]',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.less']
})
export class HelpComponent implements OnInit {
  @Input()
  name!: string;
  help$?: Observable<HelpResponse>;

  constructor(private service: HelpService) { }

  ngOnInit() {
    this.help$ = this.service.getHelp(this.name);
  }

}
