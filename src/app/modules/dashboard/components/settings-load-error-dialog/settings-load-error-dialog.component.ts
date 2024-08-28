import {
  Component,
  Input
} from '@angular/core';
import {
  NzModalComponent,
  NzModalContentDirective
} from "ng-zorro-antd/modal";
import { TranslocoDirective } from "@jsverse/transloco";
import { NzResultComponent } from "ng-zorro-antd/result";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import { ExternalLinkModule } from "../../../../shared/components/external-link/external-link.module";

@Component({
  selector: 'ats-settings-load-error-dialog',
  standalone: true,
  imports: [
    NzModalComponent,
    NzModalContentDirective,
    TranslocoDirective,
    NzResultComponent,
    ExternalLinkModule
  ],
  templateUrl: './settings-load-error-dialog.component.html',
  styleUrl: './settings-load-error-dialog.component.less'
})
export class SettingsLoadErrorDialogComponent {
  @Input()
  visible = false;

  readonly supportLink = this.environmentService.externalLinks.support;

  constructor(private readonly environmentService: EnvironmentService) {
  }
}
