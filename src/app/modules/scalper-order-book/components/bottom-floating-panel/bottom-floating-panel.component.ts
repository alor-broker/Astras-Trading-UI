import {Component, input} from '@angular/core';
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {PanelSlots, ScalperOrderBookWidgetSettings} from "../../models/scalper-order-book-settings.model";
import {LetDirective} from '@ngrx/component';
import {ModifiersIndicatorComponent} from '../modifiers-indicator/modifiers-indicator.component';
import {ShortLongIndicatorComponent} from '../short-long-indicator/short-long-indicator.component';
import {WorkingVolumesPanelComponent} from '../working-volumes-panel/working-volumes-panel.component';

@Component({
  selector: 'ats-bottom-floating-panel',
  templateUrl: './bottom-floating-panel.component.html',
  styleUrls: ['./bottom-floating-panel.component.less'],
  imports: [
    LetDirective,
    ModifiersIndicatorComponent,
    ShortLongIndicatorComponent,
    WorkingVolumesPanelComponent
  ]
})
export class BottomFloatingPanelComponent {
  readonly guid = input.required<string>();

  readonly isActive = input.required<boolean>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  showWorkingVolumes(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showWorkingVolumesPanel ?? true)
      && (settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.BottomFloatingPanel;
  }

  showShortLongIndicators(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showShortLongIndicators ?? true)
      && (settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.BottomFloatingPanel;
  }
}
