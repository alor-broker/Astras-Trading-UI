import {
    Component,
    Input
} from '@angular/core';
import { PortfolioDynamicsComponent } from "../portfolio-dynamics/portfolio-dynamics.component";
import { PositionsComponent } from "../positions/positions.component";
import { MarketTrendsComponent } from "../market-trends/market-trends.component";

@Component({
    selector: 'ats-mobile-home-screen-content',
    standalone: true,
    imports: [
        PortfolioDynamicsComponent,
        PositionsComponent,
        MarketTrendsComponent
    ],
    templateUrl: './mobile-home-screen-content.component.html',
    styleUrl: './mobile-home-screen-content.component.less'
})
export class MobileHomeScreenContentComponent {
    @Input({required: true})
    guid!: string;
}
