import {
  Component,
  input,
  TemplateRef,
  viewChild
} from '@angular/core';

@Component({
  selector: 'ats-view-selector-item',
  imports: [],
  template: `
    <ng-template>
      <ng-content/>
    </ng-template>`,
  preserveWhitespaces: false
})
export class ViewSelectorItem {
  readonly content = viewChild.required(TemplateRef);

  readonly value = input('');

  readonly disabled = input(false);
}
