import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { RibbonWidgetComponent } from './widgets/quotes-row-widget/ribbon-widget.component';
import { RibbonComponent } from './components/ribbon/ribbon.component';
import { RibbonSettingsComponent } from './components/ribbon-settings/ribbon-settings.component';
import { TranslocoModule } from '@ngneat/transloco';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import {SharedModule} from "../../shared/shared.module";

@NgModule({
  declarations: [
    RibbonWidgetComponent,
    RibbonComponent,
    RibbonSettingsComponent
  ],
  exports: [
    RibbonWidgetComponent
  ],
    imports: [
        CommonModule,
        NzIconModule,
        NzButtonModule,
        NzModalModule,
        TranslocoModule,
        NzDividerModule,
        NzTypographyModule,
        SharedModule,
    ]
})
export class RibbonModule {
}
