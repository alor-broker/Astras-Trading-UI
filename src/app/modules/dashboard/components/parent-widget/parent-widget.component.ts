import {
  AfterViewInit,
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
  BehaviorSubject,
  Observable,
  Subject
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
export class ParentWidgetComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('widgetContent')
  widgetContent?: ElementRef<HTMLElement>;

  isWidgetActivated$ = new BehaviorSubject(false);

  @Input()
  widget!: Widget;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  widgetResize: EventEmitter<DashboardItem> = new EventEmitter<DashboardItem>();
  shouldShowSettings: boolean = false;
  isLinked$?: Observable<boolean>;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  private resizeObserver?: ResizeObserver;

  constructor(
    private readonly settingsService: WidgetSettingsService
  ) {
  }

  ngOnInit(): void {

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
    this.resizeObserver?.disconnect();

    this.isWidgetActivated$.complete();
  }

  ngAfterViewInit(): void {
    this.resizeObserver?.disconnect();

    this.resizeObserver = new ResizeObserver(entries => {
      entries.forEach(x => {
        this.widgetResize.emit({
          height: Math.floor(x.contentRect.height),
          width: Math.floor(x.contentRect.width),
        } as DashboardItem);
      });
    });

    this.resizeObserver.observe(this.widgetContent!.nativeElement);
  }
}
