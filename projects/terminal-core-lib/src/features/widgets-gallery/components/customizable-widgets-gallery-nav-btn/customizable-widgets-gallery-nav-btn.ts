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
import {LocalStorageCommonConstants} from '../../../local-storage/local-storage.constants';
import {ClientDashboardType} from '../../../dashboard/types/dashboard.types';
import {CustomizableWidgetsGallery} from '../customizable-widgets-gallery/customizable-widgets-gallery';
import {WidgetsGalleryContext, WidgetsGalleryContextHelper} from '../../utils/widgets-gallery-context.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {WIDGET_COMPONENT_REGISTRY} from '@terminal-core-lib/features/dashboard/types/widget-component-registry.types';

@Component({
  selector: 'ats-customizable-widgets-gallery-nav-btn',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective,
    CustomizableWidgetsGallery
  ],
  templateUrl: './customizable-widgets-gallery-nav-btn.html',
  styleUrl: './customizable-widgets-gallery-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomizableWidgetsGalleryNavBtn implements OnInit {
  readonly galleryVisible = signal(false);

  readonly atsDisabled = input(false);

  galleryContext$!: Observable<WidgetsGalleryContext>;

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
    this.galleryContext$ = WidgetsGalleryContextHelper.create(
      this.widgetsMetaService.getWidgetsMeta(),
      this.translatorService.getLangChanges(),
      this.currentDashboard$.pipe(map(dashboard => dashboard.type)),
      this.widgetRegistry,
      () => this.localStorageService.getItem<boolean>(LocalStorageCommonConstants.DemoModeStorageKey) ?? false,
      [ClientDashboardType.ClientDesktop]
    );
  }
}
