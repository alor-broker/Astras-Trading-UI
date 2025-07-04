import { Component } from '@angular/core';
import { TranslatorService } from "../../../../shared/services/translator.service";
import { switchMap } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-usage-disclaimer',
  templateUrl: './usage-disclaimer.component.html',
  styleUrl: './usage-disclaimer.component.less',
  standalone: false
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
