import {
  Component,
  inject,
  input,
  output
} from '@angular/core';
import { QuickAccessPanelWidget } from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import { FormsModule } from "@angular/forms";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { toObservable } from "@angular/core/rxjs-interop";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { AsyncPipe } from "@angular/common";
import { NzIconDirective } from "ng-zorro-antd/icon";

@Component({
  selector: 'ats-quick-panel-item-form',
  imports: [
    NzSelectComponent,
    FormsModule,
    NzOptionComponent,
    AsyncPipe,
    NzIconDirective
  ],
  templateUrl: './quick-panel-item-form.component.html',
  styleUrl: './quick-panel-item-form.component.less',
})
export class QuickPanelItemFormComponent {
  readonly item = input.required<QuickAccessPanelWidget | null>();

  readonly availableWidgetTypes = input.required<string[]>();

  readonly itemChanged = output<QuickAccessPanelWidget | null>();

  protected readonly readonlyWidget = 'mobile-home-screen';

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly translatorService = inject(TranslatorService);

  protected readonly selectableWidgets$ = combineLatest({
    widgetTypes: toObservable(this.availableWidgetTypes),
    meta: this.widgetsMetaService.getWidgetsMeta(),
    lang: this.translatorService.getLangChanges(),
    current: toObservable(this.item)
  }).pipe(
    map(x => {
      const allTypes = [...x.widgetTypes];
      if (x.current != null) {
        allTypes.push(x.current.widgetType);
      }

      return allTypes
        .map(widgetType => {
          const meta = x.meta.find(m => m.typeId === widgetType);
          if (meta == null || meta.mobileMeta == null) {
            return null;
          }

          return {
            widgetType: widgetType,
            displayName: WidgetsHelper.getWidgetName(meta.mobileMeta.widgetName ?? meta.widgetName, x.lang),
            icon: meta.mobileMeta.galleryIcon ?? 'appstore'
          };
        })
        .filter(x => x != null)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    })
  );

  protected clear(): void {
    this.itemChanged.emit(null);
  }

  protected changeWidgetType(newType: string): void {
    this.itemChanged.emit({
      ...this.item(),
      widgetType: newType
    });
  }
}
