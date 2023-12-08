import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay
} from "rxjs";
import { map } from "rxjs/operators";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { WidgetCategory } from "../../../../shared/models/widget-meta.model";

interface WidgetDisplay {
  typeId: string;
  icon: string;
  name: string;
}

interface WidgetGroup {
  category: WidgetCategory;
  widgets: WidgetDisplay[];
}

interface MenuDisplay {
  allCategory: WidgetGroup;
  groups: WidgetGroup[];
}

@Component({
  selector: 'ats-widget-menu',
  templateUrl: './widget-menu.component.html',
  styleUrls: ['./widget-menu.component.less']
})
export class WidgetMenuComponent implements OnInit {
  @Input() public showResetItem: boolean = false;
  @Output() public selected = new EventEmitter<string>();
  @Output() public resetDashboard = new EventEmitter<void>();

  menuDisplay$!: Observable<MenuDisplay>;

  constructor(
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService
  ) {
  }

  ngOnInit() {
    const orderedCategories = [
      WidgetCategory.All,
      WidgetCategory.ChartsAndOrderbooks,
      WidgetCategory.PositionsTradesOrders,
      WidgetCategory.Info,
      WidgetCategory.Details
    ];

    this.menuDisplay$ = combineLatest([
        this.widgetsMetaService.getWidgetsMeta(),
        this.translatorService.getLangChanges()
      ]
    ).pipe(
      map(([meta, lang]) => {
          const groups = new Map<WidgetCategory, WidgetDisplay[]>;

          const widgets = meta
            .filter(x => !!x.desktopMeta && x.desktopMeta.enabled)
            .sort((a, b) => {
                return (a.desktopMeta!.galleryOrder ?? 0) - (b.desktopMeta!.galleryOrder ?? 0);
              }
            );

          widgets.forEach(widgetMeta => {
            if (!groups.has(widgetMeta.desktopMeta!.category)) {
              groups.set(widgetMeta.desktopMeta!.category, []);
            }

            const groupWidgets = groups.get(widgetMeta.desktopMeta!.category)!;

            groupWidgets.push(({
              typeId: widgetMeta.typeId,
              name: WidgetsHelper.getWidgetName(widgetMeta.widgetName, lang) ?? widgetMeta.typeId,
              icon: widgetMeta.desktopMeta?.galleryIcon ?? 'appstore'
            }));
          });

          return Array.from(groups.entries())
            .sort((a, b) => {
              const aIndex = orderedCategories.indexOf(a[0]);
              const bIndex = orderedCategories.indexOf(b[0]);

              return aIndex - bIndex;
            })
            .map(value => ({
              category: value[0],
              widgets: value[1]
            } as WidgetGroup));
        }
      ),
      map(groups => {
        const menu: MenuDisplay = {
          allCategory: groups.find(g => g.category === WidgetCategory.All) ?? {
            category: WidgetCategory.All,
            widgets: []
          },
          groups: groups.filter(g => g.category !== WidgetCategory.All)
        };

        return menu;
      }),
      shareReplay(1)
    );
  }
}
