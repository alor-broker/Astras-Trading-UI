import {ChangeDetectionStrategy, Component, Input, OnDestroy,} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
    selector: 'ats-parent-widget',
    templateUrl: './parent-widget.component.html',
    styleUrls: ['./parent-widget.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ParentWidgetComponent implements OnDestroy {
  isWidgetActivated$ = new BehaviorSubject(false);

  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  ngOnDestroy(): void {
    this.isWidgetActivated$.complete();
  }
}
