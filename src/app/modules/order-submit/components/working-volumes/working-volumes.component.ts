import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-working-volumes',
  templateUrl: './working-volumes.component.html',
  styleUrls: ['./working-volumes.component.less']
})
export class WorkingVolumesComponent {
  @Input()
  workingVolumes: number[] = [];

  @Input()
  ask: { volume: number, price: number } | null = null;
  @Input()
  bid: { volume: number, price: number } | null = null;

  @Output()
  itemSelected = new EventEmitter<{ volume: number, price?: number }>();

  constructor() {
  }

  get sortedVolumes(): number[] {
    return [...this.workingVolumes].sort((a, b) => a - b);
  }

  emitItemSelected(volume: number, price?: number) {
    this.itemSelected.emit({
      volume,
      price
    });
  }
}
