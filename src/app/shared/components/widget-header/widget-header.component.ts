import {Component, EventEmitter, Input, Output} from '@angular/core';
import {WidgetSettingsService} from '../../services/widget-settings.service';
import {ManageDashboardsService} from '../../services/manage-dashboards.service';
import {ModalService} from '../../services/modal.service';
import {instrumentsBadges} from '../../utils/instruments';
import {WidgetMeta} from "../../models/widget-meta.model";
import {TranslatorService} from "../../services/translator.service";
import {WidgetsHelper} from "../../utils/widgets";

@Component({
  selector: 'ats-widget-header[guid]',
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.less']
})
export class WidgetHeaderComponent {
  badges = instrumentsBadges;

  @Input()
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
  titleText: string | null = null;

  @Input()
  linkToActive?: boolean;

  @Input()
  hasSettings: boolean = false;

  @Input()
  hasHelp: boolean = false;

  @Output()
  switchSettings = new EventEmitter();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
    private readonly modal: ModalService,
    private readonly translatorService: TranslatorService
  ) {
  }

  switchBadgeColor(badgeColor: string) {
    this.settingsService.updateSettings(this.guid, {badgeColor});
  }

  changeLinkToActive($event: MouseEvent | TouchEvent, linkToActive: boolean): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.settingsService.updateIsLinked(this.guid, linkToActive);
  }

  removeItem($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }

  onSwitchSettings($event: MouseEvent | TouchEvent) {
    $event.preventDefault();
    $event.stopPropagation();
    this.switchSettings.emit();
  }

  onOpenHelp($event: MouseEvent | TouchEvent) {
    $event.preventDefault();
    $event.stopPropagation();

    if (!this.widgetMeta) {
      throw new Error('Unknown widgetMeta');
    }

    this.modal.openHelpModal(this.widgetMeta.typeId);
  }

  getIconTooltip(): string {
    if (!this.widgetMeta) {
      return '';
    }

    return WidgetsHelper.getWidgetName(this.widgetMeta.widgetName, this.translatorService.getActiveLang());
  }
}
