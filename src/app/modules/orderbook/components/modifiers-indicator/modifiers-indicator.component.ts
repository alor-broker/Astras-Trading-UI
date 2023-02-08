import { Component, OnInit } from '@angular/core';
import { Observable } from "rxjs";
import { ModifierKeys } from "../../../../shared/models/modifier-keys.model";
import { HotKeyCommandService } from "../../../../shared/services/hot-key-command.service";

@Component({
  selector: 'ats-modifiers-indicator',
  templateUrl: './modifiers-indicator.component.html',
  styleUrls: ['./modifiers-indicator.component.less']
})
export class ModifiersIndicatorComponent implements OnInit {
  modifierKeyPressed$!: Observable<ModifierKeys>;

  constructor(
    private readonly hotkeysService: HotKeyCommandService,
  ) {
  }

  ngOnInit() {
    this.modifierKeyPressed$ = this.hotkeysService.modifiers$;
  }
}
