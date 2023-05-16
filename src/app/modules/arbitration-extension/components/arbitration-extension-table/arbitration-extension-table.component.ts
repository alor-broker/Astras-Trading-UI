import { Component, Input, OnInit } from '@angular/core';
import { Observable, tap } from "rxjs";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ArbitrationExtensionService } from "../../services/arbitration-extension.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { ArbitrationExtension } from "../../models/arbitration-extension.model";
import { UntypedFormArray, UntypedFormControl, Validators } from "@angular/forms";

@Component({
  selector: 'ats-arbitration-extension[guid]',
  templateUrl: './arbitration-extension-table.component.html',
  styleUrls: ['./arbitration-extension-table.component.less']
})
export class ArbitrationExtensionTableComponent implements OnInit {
  @Input() guid!: string;

  items$?: Observable<ArbitrationExtension[]>;

  volumesForm = new UntypedFormArray([]);

  listOfColumns: BaseColumnSettings<ArbitrationExtension>[] = [
    { id: 'symbols', displayName: 'Инструменты' },
    { id: 'buyExtension', displayName: 'Рыночная раздвижка на покупку' },
    { id: 'sellExtension', displayName: 'Рыночная раздвижка на продажу' },
    { id: 'volume', displayName: 'Объём заявки', width: 60 },
    { id: 'operation', displayName: 'Операция' },
  ];

  constructor(
    private readonly service: ArbitrationExtensionService,
    private readonly modal: ModalService
  ) {
  }

  ngOnInit() {
    this.items$ = this.service.getExtensionsSubscription()
      .pipe(
        tap(items => this.volumesForm = new UntypedFormArray(items.map(() => new UntypedFormControl(1, Validators.required))))
      );
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

  buyExtension(ext: ArbitrationExtension, index: number) {
    let volume = this.getVolumeControl(index)?.value;

    this.service.buyExtension(ext.firstLeg, ext.secondLeg, volume)
      .subscribe();
  }

  sellExtension(ext: ArbitrationExtension, index: number) {
    let volume = this.getVolumeControl(index)?.value;

    this.service.buyExtension(ext.secondLeg, ext.firstLeg, volume)
      .subscribe();
  }

  getVolumeControl(index: number): UntypedFormControl | undefined {
    return this.volumesForm.at(index) as UntypedFormControl;
  }

  getAbs = Math.abs;
}
