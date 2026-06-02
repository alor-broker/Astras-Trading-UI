import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  Type,
  ViewEncapsulation
} from '@angular/core';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';
import {NgComponentOutlet} from '@angular/common';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';

interface WidgetItem {
  instance: WidgetInstance;
  componentType: Type<any> | null;
}

@Component({
  selector: 'atsm-widget-wrapper',
  imports: [
    NgComponentOutlet,
    NzTypographyComponent
  ],
  templateUrl: './widget-wrapper.html',
  styleUrl: './widget-wrapper.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetWrapper {
  readonly widgetInstance = input.required<WidgetInstance>();

  private readonly widgetRegistry = inject(WIDGET_COMPONENT_REGISTRY);

  protected readonly widgetDisplay = computed<WidgetItem | null>(() => {
    const targetInstance = this.widgetInstance();
    const targetType = this.widgetRegistry.get(targetInstance.instance.widgetType) ?? null;

    return {
      instance: targetInstance,
      componentType: targetType
    } satisfies WidgetItem;
  });
}
