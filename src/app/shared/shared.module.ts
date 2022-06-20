import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from '../shared/interceptors/auth.interceptor';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { GridsterModule } from 'angular-gridster2';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { PriceTickComponent } from './components/price-tick/price-tick.component';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgChartsModule } from 'ng2-charts';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { HttpErrorHandler } from './services/handle-error/http-error-handler';
import { LogErrorHandler } from './services/handle-error/log-error-handler';
import { ERROR_HANDLER } from './services/handle-error/error-handler';
import { AtsStoreModule } from '../store/ats-store.module';
import { NumericalDirective } from './directives/numerical.directive';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { InfiniteScrollTableComponent } from './components/infinite-scroll-table/infinite-scroll-table.component';


@NgModule({
  declarations: [
    PriceTickComponent,
    NumericalDirective,
    LoadingIndicatorComponent,
    InfiniteScrollTableComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    GridsterModule,
    NgChartsModule,
    // Ng zorro
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzFormModule,
    NzSelectModule,
    NzCollapseModule,
    NzAutocompleteModule,
    NzTagModule,
    NzCardModule,
    NzTabsModule,
    NzDropDownModule,
    NzModalModule,
    NzToolTipModule,
    NzSwitchModule,
    NzImageModule,
    NzAvatarModule,
    NzBadgeModule,
    NzNotificationModule,
    NzPopconfirmModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDatePickerModule,
    ScrollingModule,
    AtsStoreModule,
    NzSpinModule,
    NzTypographyModule,
    NzRadioModule
  ],
    exports: [
        // Ng zorro
        NzTableModule,
        NzButtonModule,
        NzIconModule,
        NzLayoutModule,
        NzFormModule,
        NzSelectModule,
        NzCollapseModule,
        NzAutocompleteModule,
        NzTagModule,
        NzCardModule,
        NzTabsModule,
        NzMenuModule,
        NzDropDownModule,
        NzModalModule,
        NzToolTipModule,
        NzSwitchModule,
        NzImageModule,
        NzAvatarModule,
        NzBadgeModule,
        NzNotificationModule,
        NzPopconfirmModule,
        NzDescriptionsModule,
        NzEmptyModule,
        NzCheckboxModule,
        ScrollingModule,
        NzDatePickerModule,
        NzTypographyModule,
        NzRadioModule,
        // modules
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        GridsterModule,
        NgChartsModule,
        // components
        PriceTickComponent,
        LoadingIndicatorComponent,
        InfiniteScrollTableComponent,
      // directives
        NumericalDirective,
    ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: ERROR_HANDLER, useClass: HttpErrorHandler, multi: true },
    { provide: ERROR_HANDLER, useClass: LogErrorHandler, multi: true }
  ],
})
export class SharedModule {
}
