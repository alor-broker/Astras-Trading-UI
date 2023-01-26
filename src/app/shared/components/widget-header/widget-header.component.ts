import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { WidgetSettingsService } from '../../services/widget-settings.service';
import { ManageDashboardsService } from '../../services/manage-dashboards.service';
import { ModalService } from '../../services/modal.service';
import { instrumentsBadges } from '../../utils/instruments';

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
  titleIcon?: string | null = null;

  @Input()
  titleIconTooltip?: string | null = null;

  @Input()
  titleText: string | null = null;

  @Input()
  linkToActive?: boolean;

  @Input()
  hasSettings: boolean = false;

  @Input()
  hasHelp: boolean = false;

  @Input()
  helpRef: string = '';

  @Output()
  switchSettings = new EventEmitter();

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly manageDashboardService: ManageDashboardsService,
    private readonly modal: ModalService,
  ) {
  }

  switchBadgeColor(badgeColor: string) {
    this.settingsService.updateSettings(this.guid, { badgeColor });
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

    if (!this.helpRef || this.helpRef.length === 0) {
      throw new Error('Unknown helpRef');
    }

    this.modal.openHelpModal(this.helpRef);
  }
}
