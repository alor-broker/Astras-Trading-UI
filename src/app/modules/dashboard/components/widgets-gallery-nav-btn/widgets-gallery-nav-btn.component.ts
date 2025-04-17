import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {
  GalleryDisplay,
  WidgetDisplay,
  WidgetGroup,
  WidgetsGalleryComponent
} from 'src/app/modules/dashboard/components/widgets-gallery/widgets-gallery.component';
import { ManageDashboardsService } from 'src/app/shared/services/manage-dashboards.service';
import { WidgetCategory } from 'src/app/shared/models/widget-meta.model';
import { WidgetsMetaService } from 'src/app/shared/services/widgets-meta.service';
import { TranslatorService } from 'src/app/shared/services/translator.service';
import { WidgetsHelper } from 'src/app/shared/utils/widgets';
import { NzIconDirective } from 'ng-zorro-antd/icon';
import { DashboardModule } from '../../dashboard.module';
import { TranslocoDirective } from '@jsverse/transloco';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {LocalStorageService} from "../../../../shared/services/local-storage.service";
import {LocalStorageCommonConstants} from "../../../../shared/constants/local-storage.constants";
import { DashboardType } from "../../../../shared/models/dashboard/dashboard.model";

@Component({
  selector: 'ats-widgets-gallery-nav-btn',
  templateUrl: './widgets-gallery-nav-btn.component.html',
  styleUrls: ['./widgets-gallery-nav-btn.component.less'],
  standalone: true,
  imports: [
    DashboardModule,
    NzIconDirective,
    AsyncPipe,
    TranslocoDirective,
    NzButtonComponent,
    WidgetsGalleryComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WidgetsGalleryNavBtnComponent implements OnInit, OnDestroy {
  private readonly currentDashboardType$ = new BehaviorSubject<DashboardType | null>(null);
  galleryVisible = false;
  widgetsGallery$!: Observable<GalleryDisplay>;

  @Input()
  atsDisabled = false;

  @Input()
  set currentDashboardType(value: DashboardType | null) {
    this.currentDashboardType$.next(value);
  }

  constructor(
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly translatorService: TranslatorService,
    private readonly localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.initWidgetsGallery();
  }

  addWidget(type: string): void {
    this.manageDashboardsService.addWidget(type);
  }

  resetDashboard(): void {
    this.manageDashboardsService.resetCurrentDashboard();
  }

  private initWidgetsGallery(): void {
    const orderedCategories = [
      WidgetCategory.All,
      WidgetCategory.ChartsAndOrderbooks,
      WidgetCategory.PositionsTradesOrders,
      WidgetCategory.Info,
      WidgetCategory.Details,
    ];

    this.widgetsGallery$ = combineLatest({
      meta: this.widgetsMetaService.getWidgetsMeta(),
      lang: this.translatorService.getLangChanges(),
      currentDashboardType: this.currentDashboardType$
    }).pipe(
      map((s) => {
        const groups = new Map<WidgetCategory, WidgetDisplay[]>();
        const isDemoModeEnabled = this.localStorageService.getItem<boolean>(LocalStorageCommonConstants.DemoModeStorageKey);

        const widgets = s.meta
          .filter((x) => {
            return x.desktopMeta != null
              && x.desktopMeta.enabled
              && (s.currentDashboardType == null || x.hideOnDashboardType == null || !x.hideOnDashboardType.includes(s.currentDashboardType))
              && (!(x.isDemoOnly ?? false) || isDemoModeEnabled);
          })
          .sort((a, b) => {
            return (
              (a.desktopMeta!.galleryOrder ?? 0) -
              (b.desktopMeta!.galleryOrder ?? 0)
            );
          });

        widgets.forEach((widgetMeta) => {
          if (!groups.has(widgetMeta.category)) {
            groups.set(widgetMeta.category, []);
          }

          const groupWidgets = groups.get(widgetMeta.category)!;

          groupWidgets.push({
            typeId: widgetMeta.typeId,
            name: WidgetsHelper.getWidgetName(widgetMeta.widgetName, s.lang),
            icon: widgetMeta.desktopMeta?.galleryIcon ?? 'appstore',
          });
        });

        return Array.from(groups.entries())
          .sort((a, b) => {
            const aIndex = orderedCategories.indexOf(a[0]);
            const bIndex = orderedCategories.indexOf(b[0]);

            return aIndex - bIndex;
          })
          .map(
            (value) =>
              ({
                category: value[0],
                widgets: value[1],
              } as WidgetGroup)
          );
      }),
      map((groups) => {
        const menu: GalleryDisplay = {
          allCategory: groups.find(
            (g) => g.category === WidgetCategory.All
          ) ?? {
            category: WidgetCategory.All,
            widgets: [],
          },
          groups: groups.filter((g) => g.category !== WidgetCategory.All),
        };

        return menu;
      }),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    this.currentDashboardType$.complete();
  }
}
