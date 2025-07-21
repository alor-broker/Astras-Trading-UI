import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { PortfolioDynamicsComponent } from "../portfolio-dynamics/portfolio-dynamics.component";
import { PositionsComponent } from "../positions/positions.component";
import { MarketTrendsComponent } from "../market-trends/market-trends.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { Observable } from "rxjs";
import { MobileHomeScreenSettings } from "../../models/mobile-home-screen-settings.model";
import { LetDirective } from "@ngrx/component";
import { Market } from "../../../../../generated/graphql.types";
import { RibbonComponent } from "../../../ribbon/components/ribbon/ribbon.component";

@Component({
    selector: 'ats-mobile-home-screen-content',
  imports: [
    PortfolioDynamicsComponent,
    PositionsComponent,
    MarketTrendsComponent,
    LetDirective,
    RibbonComponent
  ],
    templateUrl: './mobile-home-screen-content.component.html',
    styleUrl: './mobile-home-screen-content.component.less'
})
export class MobileHomeScreenContentComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  readonly Market = Market;

  protected settings$!: Observable<MobileHomeScreenSettings>;

  constructor(private readonly widgetSettingsService: WidgetSettingsService) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<MobileHomeScreenSettings>(this.guid);
  }
}
