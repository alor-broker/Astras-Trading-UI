import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  TemplateRef,
  ViewEncapsulation
} from '@angular/core';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {WidgetMeta} from '@terminal-core-lib/features/widgets-gallery/services/widgets-meta-service.types';
import {
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {BaseBadges} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {HelpService} from '@terminal-core-lib/features/help-docs/services/help.service';
import {WidgetsHelper} from '@terminal-widgets-lib/common/utils/widget-name.helper';
import {NzBadgeComponent} from 'ng-zorro-antd/badge';
import {
  NzDropdownDirective,
  NzDropdownMenuComponent
} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {
  AsyncPipe,
  NgTemplateOutlet
} from '@angular/common';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';

@Component({
  selector: 'ats-widget-header',
  imports: [
    NzBadgeComponent,
    NzDropdownDirective,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuItemComponent,
    AsyncPipe,
    NzPopoverDirective,
    NzIconDirective,
    NgTemplateOutlet,
    TranslocoDirective,
    NzButtonComponent
  ],
  templateUrl: './widget-header.html',
  styleUrl: './widget-header.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHeader implements OnInit {
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

  protected readonly deviceInfo$ = inject(DeviceService).deviceInfo$;

  private readonly settingsService = inject(WidgetSettingsService);

  private readonly manageDashboardService = inject(DesktopManageDashboardsService, {optional: true});

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  private readonly translatorService = inject(TranslatorService);

  private readonly helpService = inject(HelpService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

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
          () => this.terminalSettingsService.getSettings().pipe(map(s => s.badgesColors ?? BaseBadges)),
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
                assignedInstrument: assignedInstrument
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
    this.manageDashboardService?.removeWidget(this.guid());
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

