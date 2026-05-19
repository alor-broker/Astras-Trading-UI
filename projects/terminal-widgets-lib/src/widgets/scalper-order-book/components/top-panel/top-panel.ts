import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {LetDirective} from '@ngrx/component';

import {WorkingVolumesPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/working-volumes-panel/working-volumes-panel';
import {ShortLongIndicator} from '@terminal-widgets-lib/widgets/scalper-order-book/components/short-long-indicator/short-long-indicator';
import {ModifiersIndicator} from '@terminal-widgets-lib/widgets/scalper-order-book/components/modifiers-indicator/modifiers-indicator';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  PanelSlots,
  ScalperOrderBookWidgetSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';

@Component({
  selector: 'ats-top-panel',
  templateUrl: './top-panel.html',
  imports: [
    LetDirective,
    WorkingVolumesPanel,
    ModifiersIndicator,
    ShortLongIndicator
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class TopPanel {
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
