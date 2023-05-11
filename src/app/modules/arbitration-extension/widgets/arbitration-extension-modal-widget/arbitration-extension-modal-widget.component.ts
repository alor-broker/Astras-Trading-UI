import { Component, OnInit } from '@angular/core';
import { Observable, of, take } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { ArbitrationExtensionService } from "../../services/arbitration-extension.service";
import { ArbitrationExtension } from "../../models/arbitration-extension.model";

@Component({
  selector: 'ats-arbitration-extension-modal-widget',
  templateUrl: './arbitration-extension-modal-widget.component.html',
  styleUrls: ['./arbitration-extension-modal-widget.component.less']
})
export class ArbitrationExtensionModalWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  extensionInfo$: Observable<ArbitrationExtension | null> = of(null);
  formData: { value: ArbitrationExtension, isValid: boolean } | null = null;

  constructor(
    private modalService: ModalService,
    private service: ArbitrationExtensionService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowExtensionModal$;
    this.extensionInfo$ = this.modalService.extensionParams$;
  }

  handleCancel() {
    this.modalService.closeExtensionModal();
  }

  formChange(data: { value: ArbitrationExtension, isValid: boolean }) {
    this.formData = data;
  }

  addOrEdit() {
    this.extensionInfo$
      .pipe(
        take(1)
      )
      .subscribe(ext => {
        if (ext) {
          this.service.editExtension(this.formData!.value);
        } else {
          this.service.addExtension(this.formData!.value);
        }

        this.handleCancel();
      });
  }
}
