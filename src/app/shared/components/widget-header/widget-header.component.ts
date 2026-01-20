import { Component, input, OnInit, TemplateRef, output, inject } from '@angular/core';
import {WidgetSettingsService} from '../../services/widget-settings.service';
import {ManageDashboardsService} from '../../services/manage-dashboards.service';
import {instrumentsBadges} from '../../utils/instruments';
import {WidgetMeta} from "../../models/widget-meta.model";
import {TranslatorService} from "../../services/translator.service";
import {WidgetsHelper} from "../../utils/widgets";
import {DashboardContextService} from "../../services/dashboard-context.service";
import {Observable, shareReplay} from "rxjs";
import {InstrumentKey} from "../../models/instruments/instrument-key.model";
import {map} from "rxjs/operators";
import {HelpService} from "../../services/help.service";
import {mapWith} from "../../utils/observable-helper";
import {TerminalSettingsService} from "../../services/terminal-settings.service";
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {NzDropDownDirective, NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {NzMenuDirective, NzMenuItemComponent} from 'ng-zorro-antd/menu';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {JoyrideModule} from 'ngx-joyride';

@Component({
  selector: 'ats-widget-header',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less'],
  imports: [
    NzBadgeComponent,
    NzDropDownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    NzIconDirective,
    NzPopoverDirective,
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent,
    AsyncPipe,
    JoyrideModule
  ]
})
export class WidgetHeaderComponent implements OnInit {
  private readonly settingsService = inject(WidgetSettingsService);
  private readonly manageDashboardService = inject(ManageDashboardsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly translatorService = inject(TranslatorService);
  private readonly helpService = inject(HelpService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

  readonly guid = input.required<string>();

  readonly showBadgesMenu = input(false);

  readonly selectedBadgeColor = input<(string | null) | undefined>(null);

  readonly badgeShape = input<'circle' | 'square'>('circle');

  readonly widgetMeta = input<WidgetMeta | null>(null);

  readonly customTitle = input<string | null>(null);

  readonly linkToActive = input<boolean | null>(null);

  readonly hasSettings = input(false);

  readonly titleTemplate = input<TemplateRef<any> | null>(null);

  readonly switchSettings = output();

  titleText!: string;

  helpUrl$!: Observable<string | null>;

  badgeOptions$!: Observable<{
    color: string;
    assignedInstrument: InstrumentKey | null;
  }[]>;

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  get title(): string {
    const customTitle = this.customTitle();
    return customTitle != null && customTitle.length > 0
      ? customTitle as string
      : this.titleText;
  }

  ngOnInit(): void {
    this.badgeOptions$ = this.dashboardContextService.instrumentsSelection$
      .pipe(
        mapWith(
          () => this.terminalSettingsService.getSettings().pipe(map(s => s.badgesColors ?? instrumentsBadges)),
          (currentSelection, badgesColors) => ({currentSelection, badgesColors})
        ),
        map(({currentSelection, badgesColors}) => {
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

    const widgetMeta = this.widgetMeta();

    this.titleText = widgetMeta != null
      ? WidgetsHelper.getWidgetName(widgetMeta.widgetName, this.translatorService.getActiveLang())
      : '';

    this.helpUrl$ = this.helpService.getWidgetHelp(widgetMeta?.typeId ?? '');
  }

  switchBadgeColor(badgeColor: string): void {
    this.settingsService.updateSettings(this.guid(), {badgeColor});
  }

  changeLinkToActive(event: MouseEvent | TouchEvent, linkToActive: boolean): void {
    this.preventMouseEvents(event);
    this.settingsService.updateIsLinked(this.guid(), linkToActive);
  }

  removeItem(event: MouseEvent | TouchEvent): void {
    this.preventMouseEvents(event);
    this.manageDashboardService.removeWidget(this.guid());
  }

  onSwitchSettings(event: MouseEvent | TouchEvent): void {
    this.preventMouseEvents(event);
    this.switchSettings.emit();
  }

  preventMouseEvents(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  openHelp(event: MouseEvent | TouchEvent, helpUrl: string): void {
    this.preventMouseEvents(event);
    window.open(helpUrl, '_blank');
  }

  getIconTooltip(): string {
    return this.titleText;
  }
}
