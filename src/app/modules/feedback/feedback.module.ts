import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FeedbackWidgetComponent } from './widgets/feedback-widget/feedback-widget.component';
import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTypographyModule } from 'ng-zorro-antd/typography';


@NgModule({
  declarations: [
    FeedbackWidgetComponent
  ],
  exports: [
    FeedbackWidgetComponent
  ],
  imports: [
    CommonModule,
    NzModalModule,
    ReactiveFormsModule,
    NzFormModule,
    NzRateModule,
    NzInputModule,
    NzButtonModule,
    FormsModule,
    NzTypographyModule
  ]
})
export class FeedbackModule {
}
