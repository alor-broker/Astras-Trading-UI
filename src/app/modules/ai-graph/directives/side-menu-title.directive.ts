import {Directive, TemplateRef} from '@angular/core';

@Directive({
  selector: '[atsSideMenuTitle]',
  standalone: true
})
export class SideMenuTitleDirective {
  constructor(public templateRef: TemplateRef<unknown>) {

  }
}
