import {ChangeDetectionStrategy, Component, Input, OnDestroy,} from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";

@Component({
  selector: 'ats-parent-widget[widget]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentWidgetComponent implements OnDestroy {
  isWidgetActivated$ = new BehaviorSubject(false);

  @Input()
  isBlockWidget!: boolean;
  @Input()
  widget!: WidgetInstance;
  @Input()
  isVisible: boolean = true;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor() {
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.isWidgetActivated$.complete();
  }
}
