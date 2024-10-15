import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SetupInstrumentNotificationsComponent } from './components/setup-instrument-notifications/setup-instrument-notifications.component';
import {NzDividerModule} from "ng-zorro-antd/divider";
import {TranslocoModule} from "@jsverse/transloco";
import {NzButtonModule} from "ng-zorro-antd/button";
import {NzIconModule} from "ng-zorro-antd/icon";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NzFormModule} from "ng-zorro-antd/form";
import {NzInputModule} from "ng-zorro-antd/input";
import {SharedModule} from "../../shared/shared.module";
import {NzSpinModule} from "ng-zorro-antd/spin";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";

@NgModule({
    declarations: [
        SetupInstrumentNotificationsComponent
    ],
    exports: [
        SetupInstrumentNotificationsComponent
    ],
    imports: [
        CommonModule,
        NzDividerModule,
        TranslocoModule,
        NzButtonModule,
        NzIconModule,
        FormsModule,
        NzFormModule,
        ReactiveFormsModule,
        NzInputModule,
        SharedModule,
        NzSpinModule,
        InputNumberComponent
    ]
})
export class PushNotificationsModule {
}
