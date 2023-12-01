import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-merged-badge',
  templateUrl: './merged-badge.component.html',
  styleUrls: ['./merged-badge.component.less']
})
export class MergedBadgeComponent {
  @Input()
  colors: string[] = [];
  @Input()
  width: number = 10;

  getBackgroundStyle(): string {
    if (this.colors.length === 1) {
      return this.colors[0];
    }

    const degPerColor = Math.floor(360 / this.colors.length);
    const items = [];
    let currentAngle = 0;
    for (let i = 0; i < this.colors.length - 1; i++) {
      const color = this.colors[i];
      items.push(`${color} ${currentAngle}deg`);
      currentAngle += degPerColor;
      items.push(`${color} ${currentAngle}deg`);
    }

    items.push(`${this.colors[this.colors.length - 1]} ${currentAngle}deg`);

    return `conic-gradient(${items.join(',')})`;
  }
}
