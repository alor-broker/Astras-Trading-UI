import {Component} from '@angular/core';
import {TranslatorService} from "../../../../shared/services/translator.service";
import {switchMap} from "rxjs";
import {map} from "rxjs/operators";
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {MarkdownComponent} from 'ngx-markdown';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-usage-disclaimer',
  templateUrl: './usage-disclaimer.component.html',
  styleUrl: './usage-disclaimer.component.less',
  imports: [
    NzAlertComponent,
    MarkdownComponent,
    AsyncPipe
  ]
})
export class UsageDisclaimerComponent {
  readonly text$ = this.translatorService.getLangChanges().pipe(
    switchMap(() => this.translatorService.getTranslator('ai-chat/usage-disclaimer')),
    map(translator => translator(['text']))
  );

  constructor(
    private readonly translatorService: TranslatorService
  ) {
  }
}
