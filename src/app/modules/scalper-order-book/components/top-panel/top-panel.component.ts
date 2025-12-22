import {Component, input} from '@angular/core';
import {PanelSlots, ScalperOrderBookWidgetSettings} from "../../models/scalper-order-book-settings.model";
import {ScalperOrderBookDataContext,} from "../../models/scalper-order-book-data-context.model";
import {LetDirective} from '@ngrx/component';
import {WorkingVolumesPanelComponent} from '../working-volumes-panel/working-volumes-panel.component';
import {ModifiersIndicatorComponent} from '../modifiers-indicator/modifiers-indicator.component';
import {ShortLongIndicatorComponent} from '../short-long-indicator/short-long-indicator.component';

@Component({
  selector: 'ats-top-panel',
  templateUrl: './top-panel.component.html',
  styleUrls: ['./top-panel.component.less'],
  imports: [
    LetDirective,
    WorkingVolumesPanelComponent,
    ModifiersIndicatorComponent,
    ShortLongIndicatorComponent
  ]
})
export class TopPanelComponent {
  readonly guid = input.required<string>();

  readonly isActive = input.required<boolean>();

  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  showWorkingVolumes(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showWorkingVolumesPanel ?? true)
      && (settings.workingVolumesPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.TopPanel;
  }

  showShortLongIndicators(settings: ScalperOrderBookWidgetSettings): boolean {
    return (settings.showShortLongIndicators ?? true)
      && (settings.shortLongIndicatorsPanelSlot ?? PanelSlots.BottomFloatingPanel) === PanelSlots.TopPanel;
  }
}
