import {
  Component,
  input
} from '@angular/core';
import { NgStyle } from "@angular/common";

@Component({
    selector: 'ats-merged-badge',
    templateUrl: './merged-badge.component.html',
    styleUrls: ['./merged-badge.component.less'],
    imports: [
    NgStyle
]
})
export class MergedBadgeComponent {
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
