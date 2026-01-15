import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[atsSideMenuTitle]',
  standalone: true
})
export class SideMenuTitleDirective {  templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
