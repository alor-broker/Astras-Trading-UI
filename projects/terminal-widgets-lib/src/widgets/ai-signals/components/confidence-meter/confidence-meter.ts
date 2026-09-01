import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation
} from '@angular/core';
import {SignalDirection} from '../../services/ai-signals-service.types';

// Conviction meter: a slim bar filled proportionally to the 0-10 confidence and tinted by direction.
// Shared between the signal card and the details verdict header so conviction reads the same everywhere.
@Component({
  selector: 'ats-confidence-meter',
  templateUrl: './confidence-meter.html',
  styleUrl: './confidence-meter.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfidenceMeter {
  readonly confidence = input.required<number>();

  readonly direction = input<SignalDirection | null>(null);

  protected readonly maxConfidence = 10;

  protected readonly directions = SignalDirection;

  protected readonly fillPercent = computed(() => {
    const ratio = this.confidence() / this.maxConfidence;

    return Math.max(0, Math.min(100, ratio * 100));
  });
}
