import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { HelpResponse } from '../../models/help-response.model';
import { HelpService } from '../../services/help.service';
import { environment } from 'src/environments/environment';
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.less']
})
export class HelpComponent implements OnInit {

  readonly externalLinks = environment.externalLinks;

  @Input({required: true})
  name!: string;
  help$?: Observable<HelpResponse>;

  constructor(private service: HelpService) { }

  ngOnInit() {
    this.help$ = this.service.getHelp(this.name)
      .pipe(
        map(help => ({
          ...help,
          markdown: help.markdown.replace(
            '.gitbook/assets/',
            'https://github.com/alor-broker/Astras-Docs/raw/main/.gitbook/assets/'
          )
        }))
      );
  }

}
