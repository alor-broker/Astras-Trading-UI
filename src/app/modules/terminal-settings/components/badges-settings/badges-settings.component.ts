import { Component } from '@angular/core';
import { additionalInstrumentsBadges, instrumentsBadges, defaultBadgeColor } from "../../../../shared/utils/instruments";
import { CdkDrag, CdkDragEnter, CdkDragStart } from "@angular/cdk/drag-drop";
import {
  FormBuilder,
  NG_VALUE_ACCESSOR,
} from "@angular/forms";
import {
  ControlValueAccessorBaseComponent
} from "../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component";

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
  ]
})
export class BadgesSettingsComponent extends ControlValueAccessorBaseComponent<string[]> {
  newBadgeColorControl = this.formBuilder.nonNullable.control('');

  defaultBadgeColor = defaultBadgeColor;

  draggedBadge: string | null = null;

  badgesColors: string[] = [];

  constructor(private readonly formBuilder: FormBuilder) {
    super();
  }

  protected needMarkTouched(): boolean {
    return false;
  }

  protected emitValue(): void {
    super.emitValue(this.badgesColors);
  }

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
}
