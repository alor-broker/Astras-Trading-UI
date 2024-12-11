import {
  Component,
  Input
} from '@angular/core';
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";

@Component({
  selector: 'ats-truncated-text',
  standalone: true,
  imports: [
    NzTooltipDirective
  ],
  template: `
        <span
        [class]="className"
        [nz-tooltip]="text"
        [nzTooltipTrigger]="shouldBeTruncated() ? 'hover' : null"
        >
            {{truncatedText}}
        </span>
    `,
})
export class TruncatedTextComponent {
  @Input()
  text = '';

  @Input()
  maxLength = 0;

  @Input()
  className = '';

  get truncatedText(): string {
    return this.shouldBeTruncated()
      ? `${this.text.slice(0, this.maxLength)}...`
      : this.text;
  }

  shouldBeTruncated(): boolean {
    return this.text.length > this.maxLength;
  }
}
