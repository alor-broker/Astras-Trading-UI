import { Component, inject } from '@angular/core';
import {additionalInstrumentsBadges, defaultBadgeColor, instrumentsBadges} from "../../../../shared/utils/instruments";
import {
  CdkDrag,
  CdkDragEnter,
  CdkDragPlaceholder,
  CdkDragStart,
  CdkDropList,
  CdkDropListGroup
} from "@angular/cdk/drag-drop";
import {FormBuilder, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzWaveDirective} from 'ng-zorro-antd/core/wave';
import {NzRowDirective} from 'ng-zorro-antd/grid';
import {NzFormItemComponent} from 'ng-zorro-antd/form';
import {NzCollapseComponent, NzCollapsePanelComponent} from 'ng-zorro-antd/collapse';
import {NzColorBlockComponent, NzColorPickerComponent} from 'ng-zorro-antd/color-picker';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-badges-settings',
  templateUrl: './badges-settings.component.html',
  styleUrl: './badges-settings.component.less',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: BadgesSettingsComponent
    }
  ],
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzWaveDirective,
    NzRowDirective,
    NzFormItemComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    NzColorBlockComponent,
    NzIconDirective,
    CdkDragPlaceholder,
    NzColorPickerComponent,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BadgesSettingsComponent extends ControlValueAccessorBaseComponent<string[]> {
  private readonly formBuilder = inject(FormBuilder);

  newBadgeColorControl = this.formBuilder.nonNullable.control('');

  defaultBadgeColor = defaultBadgeColor;

  draggedBadge: string | null = null;

  badgesColors: string[] = [];

  writeValue(colors: string[] | null): void {
    const colorsArray = colors ?? [];
    this.badgesColors = [...colorsArray];
  }

  addNewBadgeColor(isPopupVisible: boolean): void {
    if (isPopupVisible) {
      return;
    }

    if (
      this.newBadgeColorControl.value.length === 0 ||
      this.badgesColors.includes(this.newBadgeColorControl.value)) {
      return;
    }

    this.badgesColors = [
      ...this.badgesColors,
      this.newBadgeColorControl.value
    ];

    this.newBadgeColorControl.reset();
    this.emitValue();
  }

  addPredefinedLabels(): void {
    const colorsToAdd = [...instrumentsBadges, ...additionalInstrumentsBadges]
      .filter(b => !this.badgesColors.includes(b))
      .slice(0, 2);

    this.badgesColors = [
      ...this.badgesColors,
      ...colorsToAdd
    ];

    this.emitValue();
  }

  removeBadgeColor(e: MouseEvent, color: string): void {
    e.stopPropagation();

    this.badgesColors = this.badgesColors.filter((b: string) => b !== color);

    this.emitValue();
  }

  changeBadgesOrder(e: CdkDragEnter<string>): void {
    if (this.draggedBadge == null) {
      return;
    }

    const sourceIndex = this.badgesColors.findIndex(b => b === this.draggedBadge);
    const targetIndex = this.badgesColors.findIndex(b => b === e.container.data);

    if (sourceIndex > targetIndex) {
      this.badgesColors.splice(sourceIndex, 1);
      this.badgesColors.splice(targetIndex, 0, this.draggedBadge);
    } else {
      this.badgesColors.splice(targetIndex, 0, this.draggedBadge);
      this.badgesColors.splice(sourceIndex, 1);
    }

    this.emitValue();
  }

  badgeDragStarts(e: CdkDragStart<CdkDrag>): void {
    this.draggedBadge = e.source.dropContainer.data as string;
  }

  protected needMarkTouched(): boolean {
    return false;
  }

  protected emitValue(): void {
    super.emitValue(this.badgesColors);
  }
}
