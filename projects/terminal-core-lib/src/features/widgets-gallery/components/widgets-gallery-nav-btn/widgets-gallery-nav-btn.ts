import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from '../../../translations/services/translator.service';
import {DesktopDashboardContextService} from '../../../dashboard/desktop/services/desktop-dashboard-context.service';
import {LocalStorageService} from '../../../local-storage/local-storage.service';
import {DesktopManageDashboardsService} from '../../../dashboard/desktop/services/desktop-manage-dashboards.service';
import {WidgetsMetaService} from '../../services/widgets-meta.service';
import {map, Observable} from 'rxjs';
import {WidgetCategory} from '../../services/widgets-meta-service.types';
import {LocalStorageCommonConstants} from '../../../local-storage/local-storage.constants';
import {ClientDashboardType} from '../../../dashboard/types/dashboard.types';
import {
  GalleryDisplay,
  WidgetsGallerySideMenu
} from '../widgets-gallery-side-menu/widgets-gallery-side-menu';
import {WidgetsGalleryHelper} from '../../utils/widgets-gallery.helper';
import {WidgetsGalleryContextHelper} from '../../utils/widgets-gallery-context.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';

@Component({
  selector: 'ats-widgets-gallery-nav-btn',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    WidgetsGallerySideMenu
  ],
  templateUrl: './widgets-gallery-nav-btn.html',
  styleUrl: './widgets-gallery-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGalleryNavBtn implements OnInit {
  readonly galleryVisible = signal(false);

  widgetsGallery$!: Observable<GalleryDisplay>;

  readonly atsDisabled = input(false);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly widgetsMetaService = inject(WidgetsMetaService);

  private readonly translatorService = inject(TranslatorService);

  private readonly localStorageService = inject(LocalStorageService);

  private readonly dashboardContextService = inject(DesktopDashboardContextService);

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  private readonly widgetRegistry = inject(WIDGET_COMPONENT_REGISTRY);

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
    const galleryContext$ = WidgetsGalleryContextHelper.create(
      this.widgetsMetaService.getWidgetsMeta(),
      this.translatorService.getLangChanges(),
      this.currentDashboard$.pipe(map(dashboard => dashboard.type)),
      this.widgetRegistry,
      () => this.localStorageService.getItem<boolean>(LocalStorageCommonConstants.DemoModeStorageKey) ?? false,
      [ClientDashboardType.ClientDesktop, ClientDashboardType.ClientMobile]
    );

    this.widgetsGallery$ = galleryContext$.pipe(map(context => {
      const groups = WidgetsGalleryHelper.group(WidgetsGalleryHelper.display(context.widgets, context.language, Date.now()));
      return {
        allCategory: groups.find(group => group.category === WidgetCategory.All) ?? {category: WidgetCategory.All, widgets: []},
        groups: groups.filter(group => group.category !== WidgetCategory.All)
      };
    }));
  }
}
