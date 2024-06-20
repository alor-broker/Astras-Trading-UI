import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import {
  DomSanitizer,
  SafeUrl
} from "@angular/platform-browser";

@Component({
  selector: 'ats-terms-of-use-dialog-widget',
  templateUrl: './terms-of-use-dialog-widget.component.html',
  styleUrl: './terms-of-use-dialog-widget.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsOfUseDialogWidgetComponent {
  @Input({ required: true })
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  constructor(readonly domSanitizer: DomSanitizer) {
  }

  handleClose(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
  }

  getPreviewLink(): SafeUrl {
    const viewerLink = 'https://view.officeapps.live.com/op/embed.aspx?src=';
    const fileLink = `${window.location.origin}/assets/docs/AI_chart_terms_of_use.docx`;

    return this.domSanitizer.bypassSecurityTrustResourceUrl(`${viewerLink}${fileLink}`);
  }
}
