import { Component, Input, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ArbitrationExtensionService } from "../../services/arbitration-extension.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { ArbitrationExtension } from "../../models/arbitration-extension.model";

@Component({
  selector: 'ats-arbitration-extension[guid]',
  templateUrl: './arbitration-extension-table.component.html',
  styleUrls: ['./arbitration-extension-table.component.less']
})
export class ArbitrationExtensionTableComponent implements OnInit {
  @Input() guid!: string;

  items$?: Observable<ArbitrationExtension[]>;

  listOfColumns: BaseColumnSettings<ArbitrationExtension>[] = [
    { id: 'symbols', displayName: 'Инструменты' },
    { id: 'buyExtension', displayName: 'Рыночная раздвижка на покупку' },
    { id: 'sellExtension', displayName: 'Рыночная раздвижка на продажу' },
    { id: 'operation', displayName: 'Операция' },
  ];

  constructor(
    private readonly service: ArbitrationExtensionService,
    private readonly modal: ModalService
  ) {
  }

  ngOnInit() {
    this.items$ = this.service.getExtensionsSubscription();
  }

  addExtension() {
    this.modal.openExtensionModal();
  }

  editExtension(ext: ArbitrationExtension) {
    this.modal.openExtensionModal(ext);
  }

  removeExtension(extId: string) {
    this.service.removeExtension(extId);
  }

  buyExtension(ext: ArbitrationExtension) {
    this.service.buyExtension(ext.firstLeg, ext.secondLeg)
      .subscribe();
  }

  sellExtension(ext: ArbitrationExtension) {
    this.service.buyExtension(ext.secondLeg, ext.firstLeg)
      .subscribe();
  }
}
