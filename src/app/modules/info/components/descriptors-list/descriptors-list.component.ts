import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { DescriptorsGroup } from "../../models/instrument-descriptors.model";
import { TranslocoDirective } from "@jsverse/transloco";
import { NgStyle } from "@angular/common";

@Component({
  selector: 'ats-descriptors-list',
  standalone: true,
  imports: [
    TranslocoDirective,
    NgStyle
  ],
  templateUrl: './descriptors-list.component.html',
  styleUrl: './descriptors-list.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptorsListComponent {
  @Input()
  descriptors: DescriptorsGroup[] = [];
}
