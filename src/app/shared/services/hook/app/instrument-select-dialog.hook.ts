import { AppHook } from "./app-hook-token";
import {
  fromEvent,
  Subscription
} from "rxjs";
import { filter } from "rxjs/operators";
import { DomHelper } from "../../../utils/dom-helper";
import {
  Inject,
  Injectable,
  DOCUMENT
} from "@angular/core";

import { InstrumentSelectDialogService } from "../../../../modules/instruments/services/instrument-select-dialog.service";

@Injectable()
export class InstrumentSelectDialogHook implements AppHook {
  private subscription: Subscription | null = null;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly instrumentSelectDialogService: InstrumentSelectDialogService
  ) {
  }

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
