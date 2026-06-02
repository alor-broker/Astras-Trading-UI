import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-modifiers-indicator',
  templateUrl: './modifiers-indicator.html',
  styleUrls: ['./modifiers-indicator.less'],
  imports: [
    NzIconDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ModifiersIndicator {
  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  modifierKeyPressed$ = this.hotkeysService.modifiers$;
}
