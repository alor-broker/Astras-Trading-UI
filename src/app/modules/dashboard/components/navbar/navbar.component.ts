import { Component, DestroyRef, OnInit } from '@angular/core';
import {
  combineLatest,
  Observable,
  shareReplay,
  take
} from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ModalService } from 'src/app/shared/services/modal.service';
import { Store } from '@ngrx/store';
import { PortfolioExtended } from 'src/app/shared/models/user/portfolio-extended.model';
import { ThemeService } from '../../../../shared/services/theme.service';
import { ThemeColors } from '../../../../shared/models/settings/theme-settings.model';
import { filter, map } from 'rxjs/operators';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { FormControl } from "@angular/forms";
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import { ManageDashboardsService } from '../../../../shared/services/manage-dashboards.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { TranslatorService } from '../../../../shared/services/translator.service';
import { Dashboard } from '../../../../shared/models/dashboard/dashboard.model';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { defaultBadgeColor, toInstrumentKey } from '../../../../shared/utils/instruments';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { OrdersDialogService } from "../../../../shared/services/orders/orders-dialog.service";
import { OrderType } from "../../../../shared/models/orders/orders-dialog.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";
import { EnvironmentService } from "../../../../shared/services/environment.service";
import {
  GalleryDisplay,
  WidgetDisplay,
  WidgetGroup
} from "../widgets-gallery/widgets-gallery.component";
import { WidgetCategory } from "../../../../shared/models/widget-meta.model";
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { WidgetsMetaService } from "../../../../shared/services/widgets-meta.service";
import { NewYearHelper } from "../../utils/new-year.helper";
import { DashboardTitleHelper } from "../../utils/dashboard-title.helper";
import { HelpService } from "../../../../shared/services/help.service";

@Component({
  selector: 'ats-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.less'],
})
export class NavbarComponent implements OnInit {
  readonly externalLinks = this.environmentService.externalLinks;
  helpLink$!: Observable<string | null>;
  galleryVisible = false;

  isSideMenuVisible = false;

  portfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  selectedPortfolio$!: Observable<PortfolioExtended | null>;
  selectedDashboard$!: Observable<Dashboard>;

  themeColors$!: Observable<ThemeColors>;
  searchControl = new FormControl('');
  widgetsGallery$!: Observable<GalleryDisplay>;

  private activeInstrument$!: Observable<InstrumentKey | null>;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly store: Store,
    private readonly auth: AuthService,
    private readonly modal: ModalService,
    private readonly ordersDialogService: OrdersDialogService,
    private readonly themeService: ThemeService,
    private readonly translatorService: TranslatorService,
    private readonly widgetsMetaService: WidgetsMetaService,
    private readonly helpService: HelpService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.selectedDashboard$ = this.translatorService.getTranslator('dashboard/select-dashboard-menu').pipe(
      mapWith(() => this.dashboardContextService.selectedDashboard$, (t, d) => ({ t, d })),
      map(({ t, d }) => ({
        ...d,
        title: DashboardTitleHelper.getDisplayTitle(d, t)
      })),
      shareReplay(1)
    );

    this.portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x))),
      shareReplay(1)
    );

    this.selectedPortfolio$ =
      this.selectedDashboard$.pipe(
        map(d => d.selectedPortfolio),
        map(p => p ?? null),
        mapWith(() => this.portfolios$, (selectedKey, all) => ({ selectedKey, all })),
        map(({ selectedKey, all }) => {
          if (!selectedKey) {
            return null;
          }

          return [...all.values()]
            .reduce((c, p) => [...p, ...c], [])
            .find(p => p.portfolio === selectedKey.portfolio
              && p.exchange === selectedKey.exchange
              && p.marketType === selectedKey.marketType
            ) ?? null;
        })
      );

    this.portfolios$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(portfolios => {
        const hasActivePortfolios = Array.from(portfolios.values()).some(p => p.length > 0);

        if (!hasActivePortfolios) {
          this.modal.openEmptyPortfoliosWarningModal();
        }
      });

    this.activeInstrument$ = this.dashboardContextService.instrumentsSelection$.pipe(
      map(selection => selection[defaultBadgeColor]!)
    );

    this.themeColors$ = this.themeService.getThemeSettings().pipe(
      map(x => x.themeColors)
    );

    this.initWidgetsGallery();

    this.helpLink$ = this.helpService.getHelpLink('main');
  }

  isFindedPortfolio(portfolio: PortfolioExtended): boolean {
    const { value } = this.searchControl;
    return value == null || (`${portfolio.market} ${portfolio.portfolio}`).toUpperCase().includes((value).toUpperCase());
  }

  resetDashboard(): void {
    this.manageDashboardsService.resetCurrentDashboard();
    this.closeSideMenu();
  }

  logout(): void {
    this.auth.logout();
  }

  changePortfolio(key: PortfolioExtended): void {
    this.dashboardContextService.selectDashboardPortfolio({
      portfolio: key.portfolio,
      exchange: key.exchange,
      marketType: key.marketType
    });
  }

  addItem(type: string): void {
    this.manageDashboardsService.addWidget(type);
    this.closeSideMenu();
  }

  newOrder(): void {
    this.activeInstrument$.pipe(
      take(1)
    ).subscribe(activeInstrument => {
      if (!activeInstrument) {
        throw new Error('Instrument is not selected');
      }

      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(activeInstrument),
        initialValues: {
          orderType: OrderType.Limit,
          quantity: 1
        }
      });
    });
  }

  openTerminalSettings(): void {
    this.modal.openTerminalSettingsModal();
    this.closeSideMenu();
  }

  openThirdPartyLink(link: string): void {
    window.open(link, "_blank", 'noopener,noreferrer');
  }

  portfolioGroupsTrackByFn(index: number, item: { key: string, value: PortfolioExtended[] }): string {
    return item.key;
  }

  portfoliosTrackByFn(index: number, item: PortfolioExtended): string {
    return item.market + item.portfolio;
  }

  closeSideMenu(): void {
    this.isSideMenuVisible = false;
  }

  private initWidgetsGallery(): void{
    const orderedCategories = [
      WidgetCategory.All,
      WidgetCategory.ChartsAndOrderbooks,
      WidgetCategory.PositionsTradesOrders,
      WidgetCategory.Info,
      WidgetCategory.Details
    ];

    this.widgetsGallery$ = combineLatest([
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
            if (!groups.has(widgetMeta.category)) {
              groups.set(widgetMeta.category, []);
            }

            const groupWidgets = groups.get(widgetMeta.category)!;

            groupWidgets.push(({
              typeId: widgetMeta.typeId,
              name: WidgetsHelper.getWidgetName(widgetMeta.widgetName, lang),
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
        const menu: GalleryDisplay = {
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

  showNewYearIcon = NewYearHelper.showNewYearIcon;
}
