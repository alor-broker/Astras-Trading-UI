import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzButtonModule} from 'ng-zorro-antd/button';
import {NzModalModule} from 'ng-zorro-antd/modal';
import {RibbonComponent} from './components/ribbon/ribbon.component';
import {TranslocoModule} from '@jsverse/transloco';
import {NzTypographyModule} from 'ng-zorro-antd/typography';
import {SharedModule} from "../../shared/shared.module";
import {RibbonWidgetComponent} from "./widgets/ribbon-widget/ribbon-widget.component";

@NgModule({
  declarations: [
    RibbonWidgetComponent,
    RibbonComponent
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
    NzTypographyModule,
    SharedModule,
  ]
})
export class RibbonModule {
}
