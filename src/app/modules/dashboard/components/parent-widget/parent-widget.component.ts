import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subject
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { map } from "rxjs/operators";
import { Widget } from '../../../../shared/models/dashboard/widget.model';
import { WidgetSettings } from '../../../../shared/models/widget-settings.model';

@Component({
  selector: 'ats-parent-widget[widget]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentWidgetComponent implements OnInit, OnDestroy {
  isWidgetActivated$ = new BehaviorSubject(false);

  @Input()
  isBlockWidget!: boolean;
  @Input()
  widget!: Widget;
  isLinked$?: Observable<boolean>;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {
    this.isLinked$ = this.settingsService.getSettings<WidgetSettings>(this.getGuid()).pipe(
      map(s => s.linkToActive ?? false)
    );
  }

  getGuid() {
    const obWidget = this.widget as Widget;
    return obWidget.guid;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.isWidgetActivated$.complete();
  }
}
