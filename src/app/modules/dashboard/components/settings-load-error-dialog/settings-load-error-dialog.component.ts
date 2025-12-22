import {
  Component,
  input
} from '@angular/core';
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { TranslocoDirective } from "@jsverse/transloco";
import { NzResultComponent } from "ng-zorro-antd/result";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import {ExternalLinkComponent} from "../../../../shared/components/external-link/external-link.component";

@Component({
    selector: 'ats-settings-load-error-dialog',
    imports: [
        NzModalComponent,
        NzModalContentDirective,
        TranslocoDirective,
        NzResultComponent,
        ExternalLinkComponent
    ],
    templateUrl: './settings-load-error-dialog.component.html',
    styleUrl: './settings-load-error-dialog.component.less'
})
export class SettingsLoadErrorDialogComponent {
  readonly visible = input(false);

  readonly supportLink = this.environmentService.externalLinks?.support;

  constructor(private readonly environmentService: EnvironmentService) {
  }
}
