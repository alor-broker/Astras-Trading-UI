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
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { HttpErrorHandler } from './services/handle-error/http-error-handler';
import { LogErrorHandler } from './services/handle-error/log-error-handler';
import { ERROR_HANDLER } from './services/handle-error/error-handler';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { InfiniteScrollTableComponent } from './components/infinite-scroll-table/infinite-scroll-table.component';
import { NzPopoverModule } from "ng-zorro-antd/popover";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NOTIFICATIONS_PROVIDER } from '../modules/notifications/services/notifications-provider';
import { FeedbackNotificationsProvider } from '../modules/feedback/services/feedback-notifications-provider';
import { NzDividerModule } from "ng-zorro-antd/divider";
import { ResizeColumnDirective } from './directives/resize-column.directive';
import { TranslocoModule } from "@jsverse/transloco";
import { InstrumentBoardSelectComponent } from './components/instrument-board-select/instrument-board-select.component';
import { WidgetHeaderComponent } from './components/widget-header/widget-header.component';
import { WidgetSkeletonComponent } from './components/widget-skeleton/widget-skeleton.component';
import { JoyrideModule } from 'ngx-joyride';
import { ShortNumberComponent } from './components/short-number/short-number.component';
import { NzResizeObserverModule } from "ng-zorro-antd/cdk/resize-observer";
import { PushNotificationsProvider } from "../modules/push-notifications/services/push-notifications-provider";
import { AtsPricePipe } from './pipes/ats-price.pipe';
import {
  WidgetHeaderInstrumentSwitchComponent
} from './components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import { RemoveSelectTitlesDirective } from './directives/remove-select-titles.directive';
import { NzColorPickerModule } from "ng-zorro-antd/color-picker";
import { PriceDiffComponent } from './components/price-diff/price-diff.component';
import { DragDropModule } from "@angular/cdk/drag-drop";
import { GraphQlErrorHandlerService } from "./services/handle-error/graph-ql-error-handler.service";
import { LetDirective } from "@ngrx/component";
import { InputNumberComponent } from "./components/input-number/input-number.component";
import { InstrumentSearchComponent } from "./components/instrument-search/instrument-search.component";
import { TableRowHeightDirective } from "./directives/table-row-height.directive";
import { MergedBadgeComponent } from "./components/merged-badge/merged-badge.component";

@NgModule({
  declarations: [
    LoadingIndicatorComponent,
    InfiniteScrollTableComponent,
    ResizeColumnDirective,
    InstrumentBoardSelectComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent,
    ShortNumberComponent,
    AtsPricePipe,
    WidgetHeaderInstrumentSwitchComponent,
    RemoveSelectTitlesDirective,
    PriceDiffComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GridsterModule,
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
    NzTooltipModule,
    NzSwitchModule,
    NzImageModule,
    NzAvatarModule,
    NzBadgeModule,
    NzPopconfirmModule,
    NzDescriptionsModule,
    NzEmptyModule,
    NzCheckboxModule,
    NzDatePickerModule,
    ScrollingModule,
    NzSpinModule,
    NzTypographyModule,
    NzRadioModule,
    NzPopoverModule,
    NzInputModule,
    NzSpaceModule,
    NzDividerModule,
    JoyrideModule,
    NzResizeObserverModule,
    NzColorPickerModule,
    DragDropModule,
    LetDirective,
    InputNumberComponent,
    InstrumentSearchComponent,
    TableRowHeightDirective,
    MergedBadgeComponent
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
    NzTooltipModule,
    NzSwitchModule,
    NzImageModule,
    NzAvatarModule,
    NzBadgeModule,
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
    NzInputModule,
    NzColorPickerModule,
    // modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GridsterModule,
    TranslocoModule,
    // components
    LoadingIndicatorComponent,
    InfiniteScrollTableComponent,
    InstrumentBoardSelectComponent,
    WidgetHeaderComponent,
    WidgetSkeletonComponent,
    ShortNumberComponent,
    WidgetHeaderInstrumentSwitchComponent,
    PriceDiffComponent,
    // directives
    ResizeColumnDirective,
    RemoveSelectTitlesDirective,
    // pipes
    AtsPricePipe
  ],
  providers: [
    {provide: ERROR_HANDLER, useClass: HttpErrorHandler, multi: true},
    {provide: ERROR_HANDLER, useClass: LogErrorHandler, multi: true},
    {provide: ERROR_HANDLER, useClass: GraphQlErrorHandlerService, multi: true},
    {provide: NOTIFICATIONS_PROVIDER, useClass: FeedbackNotificationsProvider, multi: true},
    {provide: NOTIFICATIONS_PROVIDER, useClass: PushNotificationsProvider, multi: true},
    {provide: Window, useValue: window},
  ]
})
export class SharedModule {
}
