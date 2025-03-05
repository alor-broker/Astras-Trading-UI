import {Directive, TemplateRef} from '@angular/core';

@Directive({
  selector: '[atsSideMenuContent]',
  standalone: true
})
export class SideMenuContentDirective {
  constructor(public templateRef: TemplateRef<unknown>) {

  }
}
