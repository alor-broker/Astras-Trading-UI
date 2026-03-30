import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from "ng-zorro-antd/form";
import {NzSwitchComponent} from "ng-zorro-antd/switch";
import {NzOptionComponent, NzOptionGroupComponent, NzSelectComponent} from "ng-zorro-antd/select";
import {NzCollapseComponent, NzCollapsePanelComponent} from "ng-zorro-antd/collapse";
import {NzInputDirective, NzInputGroupComponent, NzInputGroupWhitSuffixOrPrefixDirective} from "ng-zorro-antd/input";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzColDirective, NzRowDirective} from "ng-zorro-antd/grid";
import {NzDividerComponent} from "ng-zorro-antd/divider";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzRadioComponent, NzRadioGroupComponent} from "ng-zorro-antd/radio";

export class FormsTesting {
  static getMocks(): any[] {
    return [
      FormsModule,
      ReactiveFormsModule,
      ...MockComponents(
        NzFormItemComponent,
        NzFormControlComponent,
        NzFormLabelComponent,
        NzCollapseComponent,
        NzCollapsePanelComponent,
        NzSelectComponent,
        NzOptionGroupComponent,
        NzOptionComponent,
        NzDividerComponent,
        NzSwitchComponent,
        NzInputGroupComponent,
        NzRadioGroupComponent,
        NzRadioComponent,
      ),
      ...MockDirectives(
        NzFormDirective,
        NzRowDirective,
        NzColDirective,
        NzInputDirective,
        NzInputGroupWhitSuffixOrPrefixDirective,
        NzIconDirective
      )
    ];
  }
}
