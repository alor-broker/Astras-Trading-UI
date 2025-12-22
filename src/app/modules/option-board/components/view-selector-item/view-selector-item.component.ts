import {
  Component,
  TemplateRef,
  ViewChild,
  input
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
  @ViewChild(TemplateRef, {static: true})
  content!: TemplateRef<void>;

  readonly value = input('');

  readonly disabled = input(false);
}
