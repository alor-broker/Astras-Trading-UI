import { NgModule } from '@angular/core';
import { HelpComponent } from './components/help/help.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { HelpWidgetComponent } from './widgets/help-widget/help-widget.component';
import { HelpRoutingModule } from './help-routing.module';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  declarations: [
    HelpComponent,
    HelpWidgetComponent
  ],
  imports: [
    SharedModule,
    HelpRoutingModule,
    MarkdownModule.forRoot(),
  ],
  exports: [
    HelpWidgetComponent
  ]
})
export class HelpModule { }
