import {Component, input} from '@angular/core';
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

@Component({
  selector: 'ats-truncated-text',
  imports: [
    NzTooltipDirective
  ],
  template: `
    <span
      [class]="className()"
      [nz-tooltip]="text()"
      [nzTooltipTrigger]="shouldBeTruncated() ? 'hover' : null"
    >
            {{ truncatedText }}
        </span>
  `
})
export class TruncatedTextComponent {
  readonly text = input('');
  readonly maxLength = input(0);

  readonly className = input('');

  get truncatedText(): string {
    const text = this.text();

    return this.shouldBeTruncated()
      ? `${text.slice(0, this.maxLength())}...`
      : text;
  }

  shouldBeTruncated(): boolean {
    return this.text().length > this.maxLength();
  }
}
