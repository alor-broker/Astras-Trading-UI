import { NgModule } from '@angular/core';
import { HelpComponent } from './components/help/help.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ExternalLinkModule } from "src/app/shared/components/external-link/external-link.module";
import { HelpWidgetComponent } from './widgets/help-widget/help-widget.component';
import { HelpRoutingModule } from './help-routing.module';
import { MarkdownModule } from 'ngx-markdown';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { TranslocoModule } from '@ngneat/transloco';

@NgModule({
    declarations: [
        HelpComponent,
        HelpWidgetComponent
    ],
    exports: [
        HelpWidgetComponent
    ],
    imports: [
        SharedModule,
        HelpRoutingModule,
        MarkdownModule.forRoot(),
        NzAlertModule,
        TranslocoModule,
        ExternalLinkModule
    ]
})
export class HelpModule { }
