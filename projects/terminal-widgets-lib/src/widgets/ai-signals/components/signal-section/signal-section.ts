import {ChangeDetectionStrategy, Component, input, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'ats-signal-section',
  templateUrl: './signal-section.html',
  styleUrl: './signal-section.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignalSection {
  readonly title = input.required<string>();

  readonly panel = input(true);
}
