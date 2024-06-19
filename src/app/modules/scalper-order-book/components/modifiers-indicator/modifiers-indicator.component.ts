import {
  Component,
  OnInit
} from '@angular/core';
import { Observable } from "rxjs";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import { ModifierKeys } from "../../models/scalper-command";

@Component({
  selector: 'ats-modifiers-indicator',
  templateUrl: './modifiers-indicator.component.html',
  styleUrls: ['./modifiers-indicator.component.less']
})
export class ModifiersIndicatorComponent implements OnInit {
  modifierKeyPressed$!: Observable<ModifierKeys>;

  constructor(
    private readonly hotkeysService: ScalperHotKeyCommandService,
  ) {
  }

  ngOnInit(): void {
    this.modifierKeyPressed$ = this.hotkeysService.modifiers$;
  }
}
