import { Directive, TemplateRef, inject } from '@angular/core';

@Directive({
  selector: '[atsSideMenuContent]',
  standalone: true
})
export class SideMenuContentDirective {
  templateRef = inject<TemplateRef<unknown>>(TemplateRef);
}
