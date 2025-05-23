import {
  ChangeDetectionStrategy,
  Component,
  Input
} from '@angular/core';
import { DescriptorsGroup } from "../../models/instrument-descriptors.model";
import { TranslocoDirective } from "@jsverse/transloco";
import { NgStyle } from "@angular/common";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";

@Component({
    selector: 'ats-descriptors-list',
  imports: [
    TranslocoDirective,
    NgStyle,
    NzTooltipDirective
  ],
    templateUrl: './descriptors-list.component.html',
    styleUrl: './descriptors-list.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DescriptorsListComponent {
  @Input()
  descriptors: DescriptorsGroup[] = [];
}
