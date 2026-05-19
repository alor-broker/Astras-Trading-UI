import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';

@Component({
  selector: 'ats-merged-badge',
  imports: [],
  templateUrl: './merged-badge.html',
  styleUrl: './merged-badge.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MergedBadge {
  readonly colors = input<string[]>([]);

  readonly width = input(10);

  getBackgroundStyle(): string {
    const colors = this.colors();
    if (colors.length === 1) {
      return colors[0];
    }

    const degPerColor = Math.floor(360 / colors.length);
    const items = [];
    let currentAngle = 0;
    for (let i = 0; i < colors.length - 1; i++) {
      const color = colors[i];
      items.push(`${color} ${currentAngle}deg`);
      currentAngle += degPerColor;
      items.push(`${color} ${currentAngle}deg`);
    }

    items.push(`${colors[colors.length - 1]} ${currentAngle}deg`);

    return `conic-gradient(${items.join(',')})`;
  }
}
