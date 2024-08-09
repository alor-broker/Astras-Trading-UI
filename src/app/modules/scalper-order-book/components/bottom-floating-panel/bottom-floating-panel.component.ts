import {
  Component,
  Input
} from '@angular/core';
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import {
  PanelSlots,
  ScalperOrderBookWidgetSettings
} from "../../models/scalper-order-book-settings.model";

@Component({
  selector: 'ats-bottom-floating-panel',
  templateUrl: './bottom-floating-panel.component.html',
  styleUrls: ['./bottom-floating-panel.component.less']
})
export class BottomFloatingPanelComponent {
  @Input({ required: true })
  guid!: string;

  @Input({ required: true })
  isActive!: boolean;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  showWorkingVolumes(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showWorkingVolumesPanel ?? true)
      && (settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.BottomFloatingPanel;
  }

  showShortLongIndicators(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showShortLongIndicators ?? true)
      && (settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.BottomFloatingPanel;
  }
}
