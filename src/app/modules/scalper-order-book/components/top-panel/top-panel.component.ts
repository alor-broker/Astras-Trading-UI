import {
  Component,
  Input
} from '@angular/core';
import {
  PanelSlots,
  ScalperOrderBookWidgetSettings
} from "../../models/scalper-order-book-settings.model";
import { ScalperOrderBookDataContext, } from "../../models/scalper-order-book-data-context.model";

@Component({
  selector: 'ats-top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.less']
})
export class TopPanelComponent {
  @Input({ required: true })
  guid!: string;

  @Input({ required: true })
  isActive!: boolean;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  showWorkingVolumes(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showWorkingVolumesPanel ?? true)
      && (settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.TopPanel;
  }

  showShortLongIndicators(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showShortLongIndicators ?? true)
      && (settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.TopPanel;
  }
}
