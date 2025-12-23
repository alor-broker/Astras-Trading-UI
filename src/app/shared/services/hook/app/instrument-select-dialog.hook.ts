import { AppHook } from "./app-hook-token";
import {
  fromEvent,
  Subscription
} from "rxjs";
import { filter } from "rxjs/operators";
import { DomHelper } from "../../../utils/dom-helper";
import { Injectable, DOCUMENT, inject } from "@angular/core";

import { InstrumentSelectDialogService } from "../../../../modules/instruments/services/instrument-select-dialog.service";

@Injectable()
export class InstrumentSelectDialogHook implements AppHook {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly instrumentSelectDialogService = inject(InstrumentSelectDialogService);

  private subscription: Subscription | null = null;

  onInit(): void {
    this.subscription = fromEvent<KeyboardEvent>(this.document.body, 'keydown').pipe(
      filter(() => !DomHelper.isModalOpen()),
      filter(e => e.ctrlKey && e.code === 'KeyF'),
    ).subscribe((e) => {
      e.preventDefault();
      e.stopPropagation();
      this.instrumentSelectDialogService.openDialog({});
    });
  }

  onDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
