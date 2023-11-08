import {Component, EventEmitter, Input, OnInit, Output, TemplateRef} from '@angular/core';
import {WidgetSettingsService} from '../../services/widget-settings.service';
import {ManageDashboardsService} from '../../services/manage-dashboards.service';
import {ModalService} from '../../services/modal.service';
import {instrumentsBadges} from '../../utils/instruments';
import {WidgetMeta} from "../../models/widget-meta.model";
import {TranslatorService} from "../../services/translator.service";
import {WidgetsHelper} from "../../utils/widgets";
import {DashboardContextService} from "../../services/dashboard-context.service";
import {Observable, shareReplay} from "rxjs";
import {InstrumentKey} from "../../models/instruments/instrument-key.model";
import {map} from "rxjs/operators";
import { environment } from "../../../../environments/environment";

@Component({
  selector: 'ats-widget-header',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent implements OnInit {

  @Input({required: true})
  guid!: string;

  @Input()
  showBadgesMenu: boolean = false;

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
  hasSettings: boolean = false;

  @Input()
  hasHelp: boolean = false;

  @Input()
  titleTemplate: TemplateRef<any> | null = null;

  @Output()
  switchSettings = new EventEmitter();

  titleText!: string;

  helpUrl = environment.externalLinks.help + '/';

  badgeOptions$!: Observable<{
    color: string,
    assignedInstrument: InstrumentKey | null
  }[]>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly modal: ModalService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit(): void {
    this.badgeOptions$ = this.dashboardContextService.instrumentsSelection$.pipe(
      map(currentSelection => {
        const symbolGroups = Object.values(currentSelection)
          .reduce(
            (prev, cur) => {
              prev[cur.symbol] = (prev[cur.symbol] ?? 0) + 1;
              return prev;
            }
            , {} as { [key: string]: number }
          );

        return instrumentsBadges.map(b => {
            const assignedInstrument = currentSelection[b];

            return {
              color: b,
              assignedInstrument: !!assignedInstrument
                ? {
                  ...currentSelection[b],
                  instrumentGroup: symbolGroups[assignedInstrument.symbol] > 1
                    ? assignedInstrument.instrumentGroup
                    : undefined
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
  }

  switchBadgeColor(badgeColor: string) {
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

  onSwitchSettings(event: MouseEvent | TouchEvent) {
    this.preventMouseEvents(event);
    this.switchSettings.emit();
  }

  preventMouseEvents(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  getIconTooltip(): string {
    return this.titleText;
  }

  get title(): string {
    return !!this.customTitle
      ? this.customTitle
      : this.titleText;
  }
}
