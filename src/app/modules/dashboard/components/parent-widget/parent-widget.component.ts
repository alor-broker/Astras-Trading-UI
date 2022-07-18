import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { Widget } from 'src/app/shared/models/widget.model';
import {
  Observable,
  Subject,
  takeUntil
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AnySettings } from "../../../../shared/models/settings/any-settings.model";
import { map } from "rxjs/operators";

@Component({
  selector: 'ats-parent-widget[widget][resize]',
  templateUrl: './parent-widget.component.html',
  styleUrls: ['./parent-widget.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParentWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('widgetContent')
  widgetContent?: ElementRef<HTMLElement>;

  @Input()
  widget!: Widget;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  widgetResize: EventEmitter<DashboardItem> = new EventEmitter<DashboardItem>();
  shouldShowSettings: boolean = false;
  isLinked$?: Observable<boolean>;
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly settingsService: WidgetSettingsService
  ) {
  }

  private get contentHeightAdjustment(): number {
    // This value depends on styles. It is mainly based on the height of the widget's title.
    // 28px - header, 10px - padding (top 5px + bottom 5px), 2px - extra space
    return 40;
  }

  private get contentWidthAdjustment(): number {
    // This value depends on styles.
    // 10px - left padding, 10px - right padding
    return 20;
  }

  ngOnInit(): void {
    this.resize.pipe(
      takeUntil(this.destroy$)
    ).subscribe(i => {
      if (i.label == this.widget.gridItem.label) {
        let contentHeight = i.height ?? 0;
        let contentWidth = i.width ?? 0;
        let contentHeightAdjustment =  this.contentHeightAdjustment;
        let contentWidthAdjustment = this.contentWidthAdjustment;

        if(this.widgetContent) {
          const element = this.widgetContent.nativeElement;
          // 5 is padding. Some browsers do not include it when offsetTop is calculated
          contentHeightAdjustment = element.offsetTop + 5;
          contentWidthAdjustment = element.offsetLeft * 2;
        }

        contentHeight = contentHeight - contentHeightAdjustment;
        contentWidth = contentWidth  - contentWidthAdjustment;

        this.widgetResize.emit({
          ...i,
          height: contentHeight,
          width: contentWidth,
        } as DashboardItem);
      }
    });

    this.isLinked$ = this.settingsService.getSettings<AnySettings>(this.getGuid()).pipe(
      map(s => s.linkToActive ?? false)
    );
  }

  onSwitchSettings(value: boolean) {
    this.shouldShowSettings = value;
  }

  onLinkedChanged(isLinked: boolean) {
    this.settingsService.updateIsLinked(this.getGuid(), isLinked);
  }

  getGuid() {
    const obWidget = this.widget as Widget;
    return obWidget.guid;
  }

  hasSettings() {
    const obWidget = this.widget as Widget;
    return obWidget.hasSettings;
  }

  hasHelp() {
    const obWidget = this.widget as Widget;
    return obWidget.hasHelp;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
