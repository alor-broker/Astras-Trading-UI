import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExternalLinkComponent } from './external-link.component';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
  declarations: [ExternalLinkComponent],
  imports: [
    CommonModule,
    NzIconModule
  ],
  exports: [
    ExternalLinkComponent
  ]
})
export class ExternalLinkModule {
}
