import { Component, OnInit, inject } from '@angular/core';
import {Observable} from "rxjs";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {ModifierKeys} from "../../models/scalper-command";
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-modifiers-indicator',
  templateUrl: './modifiers-indicator.component.html',
  styleUrls: ['./modifiers-indicator.component.less'],
  imports: [
    NzIconDirective,
    AsyncPipe
  ]
})
export class ModifiersIndicatorComponent implements OnInit {
  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  modifierKeyPressed$!: Observable<ModifierKeys>;

  ngOnInit(): void {
    this.modifierKeyPressed$ = this.hotkeysService.modifiers$;
  }
}
