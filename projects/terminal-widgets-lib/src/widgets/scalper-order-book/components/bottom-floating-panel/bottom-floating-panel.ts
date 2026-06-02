import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {LetDirective} from '@ngrx/component';
import {ModifiersIndicator,} from '../modifiers-indicator/modifiers-indicator';
import {ShortLongIndicator,} from '../short-long-indicator/short-long-indicator';
import {WorkingVolumesPanel,} from '../working-volumes-panel/working-volumes-panel';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  PanelSlots,
  ScalperOrderBookWidgetSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';

@Component({
  selector: 'ats-bottom-floating-panel',
  templateUrl: './bottom-floating-panel.html',
  styleUrls: ['./bottom-floating-panel.less'],
  imports: [
    LetDirective,
    ModifiersIndicator,
    ShortLongIndicator,
    WorkingVolumesPanel
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BottomFloatingPanel {
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
