import {
  Component,
  TemplateRef,
  input,
  viewChild
} from '@angular/core';

@Component({
    selector: 'ats-view-selector-item',
    imports: [],
    template: `
    <ng-template>
      <ng-content></ng-content>
    </ng-template>`,
    preserveWhitespaces: false
})
export class ViewSelectorItemComponent {
  readonly content = viewChild.required(TemplateRef);

  readonly value = input('');

  readonly disabled = input(false);
}
