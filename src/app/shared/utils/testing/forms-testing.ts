import {
  FormsModule,
  ReactiveFormsModule
} from "@angular/forms";
import { NzFormModule } from "ng-zorro-antd/form";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { NzSliderModule } from "ng-zorro-antd/slider";
import { NzSwitchModule } from "ng-zorro-antd/switch";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzCheckboxModule } from "ng-zorro-antd/checkbox";
import { NzRadioModule } from "ng-zorro-antd/radio";
import { NzInputModule } from "ng-zorro-antd/input";

export class FormsTesting {
  static getTestingModules(): any[] {
    return [
      NoopAnimationsModule,
      FormsModule,
      ReactiveFormsModule,
      NzFormModule,
      NzInputModule,
      NzSliderModule,
      NzSwitchModule,
      NzSelectModule,
      NzCollapseModule,
      NzCheckboxModule,
      NzRadioModule
    ];
  }
}
