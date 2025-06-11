import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NewsComponent} from './components/news/news.component';
import {NewsWidgetComponent} from './widgets/news-widget/news-widget.component';
import {SharedModule} from "../../shared/shared.module";
import {NzSpinModule} from "ng-zorro-antd/spin";
import {NzResizeObserverModule} from 'ng-zorro-antd/cdk/resize-observer';
import {LetDirective} from "@ngrx/component";
import {NewsSettingsComponent} from "./components/news-settings/news-settings.component";
import {NzSliderModule} from "ng-zorro-antd/slider";
import {WidgetSettingsComponent} from "../../shared/components/widget-settings/widget-settings.component";
import {NewsDialogComponent} from "./components/news-dialog/news-dialog.component";
import { NewsFiltersComponent } from "./components/news-filters/news-filters.component";

@NgModule({
  declarations: [
    NewsComponent,
    NewsWidgetComponent,
    NewsSettingsComponent
  ],
  exports: [
    NewsWidgetComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        NzSpinModule,
        NzResizeObserverModule,
        LetDirective,
        NzSliderModule,
        WidgetSettingsComponent,
        NewsDialogComponent,
        NewsFiltersComponent,
    ]
})
export class NewsModule {
}
