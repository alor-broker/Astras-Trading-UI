import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { WidgetSettingsService } from '../../services/widget-settings.service';
import { ManageDashboardsService } from '../../services/manage-dashboards.service';
import { instrumentsBadges } from '../../utils/instruments';
import { WidgetMeta } from "../../models/widget-meta.model";
import { TranslatorService } from "../../services/translator.service";
import { WidgetsHelper } from "../../utils/widgets";
import { DashboardContextService } from "../../services/dashboard-context.service";
import { Observable, shareReplay } from "rxjs";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";
import { map } from "rxjs/operators";
import { HelpService } from "../../services/help.service";
import { mapWith } from "../../utils/observable-helper";
import { TerminalSettingsService } from "../../services/terminal-settings.service";

@Component({
    selector: 'ats-widget-header',
    templateUrl: './widget-header.component.html',
    styleUrls: ['./widget-header.component.less'],
    standalone: false
})
export class WidgetHeaderComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  @Input()
  showBadgesMenu = false;

  @Input()
  selectedBadgeColor?: string | null = null;

  @Input()
  badgeShape: 'circle' | 'square' = 'circle';

  @Input()
  widgetMeta?: WidgetMeta;

  @Input()
  customTitle: string | null = null;

  @Input()
  linkToActive?: boolean;

  @Input()
  hasSettings = false;

  @Input()
  titleTemplate: TemplateRef<any> | null = null;

  @Output()
  switchSettings = new EventEmitter();

  titleText!: string;

  helpUrl$!: Observable<string | null>;

  badgeOptions$!: Observable<{
    color: string;
    assignedInstrument: InstrumentKey | null;
  }[]>;

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly translatorService: TranslatorService,
    private readonly helpService: HelpService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    this.badgeOptions$ = this.dashboardContextService.instrumentsSelection$
      .pipe(
        mapWith(
          () => this.terminalSettingsService.getSettings().pipe(map(s => s.badgesColors ?? instrumentsBadges)),
          (currentSelection, badgesColors) => ({ currentSelection, badgesColors })
        ),
        map(({ currentSelection, badgesColors }) => {
          const symbolGroups = Object.values(currentSelection)
            .reduce(
              (prev, cur) => {
                prev[cur!.symbol] = (prev[cur!.symbol] ?? 0) + 1;
                return prev;
              },
              {} as Record<string, number | undefined>
            );

          return badgesColors.map(b => {
              const assignedInstrument = currentSelection[b] as InstrumentKey | undefined;

              return {
                color: b,
                assignedInstrument: !!assignedInstrument
                  ? {
                    ...currentSelection[b]!,
                    instrumentGroup: symbolGroups[assignedInstrument.symbol]! > 1
                      ? assignedInstrument.instrumentGroup
                      : null
                  }
                  : null
              };
            }
          );
        }),
        shareReplay(1)
      );

    this.titleText = !!this.widgetMeta
      ? WidgetsHelper.getWidgetName(this.widgetMeta.widgetName, this.translatorService.getActiveLang())
      : '';

    this.helpUrl$ = this.helpService.getWidgetHelp(this.widgetMeta?.typeId ?? '');
  }

  switchBadgeColor(badgeColor: string): void {
    this.settingsService.updateSettings(this.guid, {badgeColor});
  }

  changeLinkToActive(event: MouseEvent | TouchEvent, linkToActive: boolean): void {
    this.preventMouseEvents(event);
    this.settingsService.updateIsLinked(this.guid, linkToActive);
  }

  removeItem(event: MouseEvent | TouchEvent): void {
    this.preventMouseEvents(event);
    this.manageDashboardService.removeWidget(this.guid);
  }

  onSwitchSettings(event: MouseEvent | TouchEvent): void {
    this.preventMouseEvents(event);
    this.switchSettings.emit();
  }

  preventMouseEvents(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  getIconTooltip(): string {
    return this.titleText;
  }

  get title(): string {
    return this.customTitle != null && !!this.customTitle.length
      ? this.customTitle as string
      : this.titleText;
  }
}
