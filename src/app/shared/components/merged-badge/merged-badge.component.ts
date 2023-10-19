import {Component, Input} from '@angular/core';

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

  private readonly colorOverrides = new Map<string, string>([
    ["yellow", "#fadb14"],
    ["blue", "#1890ff"],
    ["pink", "#eb2f96"],
    ["red", "#f5222d"],
    ["orange", "#fa8c16"],
    ['green', '#49aa1b'],
    ['cyan', '#13a9aa'],
    ['geekblue', '#2b4bcd']
  ]);

  getBackgroundStyle(): string {
    if (this.colors.length === 1) {
      return this.getColor(this.colors[0]);
    }

    const degPerColor = Math.floor(360 / this.colors.length);
    const items = [];
    let currentAngle = 0;
    for (let i = 0; i < this.colors.length - 1; i++) {
      const color = this.getColor(this.colors[i]);
      items.push(`${color} ${currentAngle}deg`);
      currentAngle += degPerColor;
      items.push(`${color} ${currentAngle}deg`);
    }

    items.push(`${this.getColor(this.colors[this.colors.length - 1])} ${currentAngle}deg`);

    return `conic-gradient(${items.join(',')})`;
  }

  private getColor(color: string): string {
    return this.colorOverrides.get(color) ?? color;
  }

}
