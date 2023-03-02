import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { WidgetMenuComponent } from './components/widget-menu/widget-menu.component';
import { ColorPickerInputComponent } from './components/color-picker-input/color-picker-input.component';
import { ColorChromeModule } from "ngx-color/chrome";
import { NzPopoverModule } from "ng-zorro-antd/popover";
import { NzInputModule } from "ng-zorro-antd/input";
import { ShortNumberPipe } from './pipes/short-number.pipe';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NOTIFICATIONS_PROVIDER } from '../modules/notifications/services/notifications-provider';
import { FeedbackNotificationsProvider } from '../modules/feedback/services/feedback-notifications-provider';
import { InstrumentSearchComponent } from './components/instrument-search/instrument-search.component';
import { NzDividerModule } from "ng-zorro-antd/divider";
import { ResizeColumnDirective } from './directives/resize-column.directive';
import { TranslocoModule } from "@ngneat/transloco";
import { InstrumentBoardSelectComponent } from './components/instrument-board-select/instrument-board-select.component';
import { EditableStringComponent } from './components/editable-string/editable-string.component';
import { WidgetHeaderComponent } from './components/widget-header/widget-header.component';
import { WidgetSkeletonComponent } from './components/widget-skeleton/widget-skeleton.component';
import { JoyrideModule } from 'ngx-joyride';
import { NetworkIndicatorComponent } from "./components/network-indicator/network-indicator.component";

@NgModule({
  declarations: [
    PriceTickComponent,
    NumericalDirective,
    LoadingIndicatorComponent,
    InfiniteScrollTableComponent,
    WidgetMenuComponent,
    ColorPickerInputComponent,
    ShortNumberPipe,
    InstrumentSearchComponent,
    ResizeColumnDirective,
    InstrumentBoardSelectComponent,
    EditableStringComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent,
    NetworkIndicatorComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GridsterModule,
    NgChartsModule,
    TranslocoModule,
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
    NzRadioModule,
    ColorChromeModule,
    NzPopoverModule,
    NzInputModule,
    NzSpaceModule,
    NzDividerModule,
    JoyrideModule,
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
    NzPopoverModule,
    NzSpaceModule,
    // modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GridsterModule,
    NgChartsModule,
    TranslocoModule,
    // components
    PriceTickComponent,
    LoadingIndicatorComponent,
    InfiniteScrollTableComponent,
    WidgetMenuComponent,
    ColorPickerInputComponent,
    InstrumentSearchComponent,
    InstrumentBoardSelectComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent,
    EditableStringComponent,
    NetworkIndicatorComponent,
    // directives
    NumericalDirective,
    ShortNumberPipe,
    ResizeColumnDirective,

  ],
  providers: [
    {provide: ERROR_HANDLER, useClass: HttpErrorHandler, multi: true},
    {provide: ERROR_HANDLER, useClass: LogErrorHandler, multi: true},
    {provide: NOTIFICATIONS_PROVIDER, useClass: FeedbackNotificationsProvider, multi: true},
    {provide: Window, useValue: window},
  ]
})
export class SharedModule {
}
