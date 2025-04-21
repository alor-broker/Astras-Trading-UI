import { Component } from '@angular/core';
import { AstrasLogoComponent } from "../../../../shared/components/astras-logo/astras-logo.component";

@Component({
    selector: 'ats-desktop-navbar',
    imports: [
        AstrasLogoComponent,
    ],
    templateUrl: './desktop-navbar.component.html',
    styleUrl: './desktop-navbar.component.less'
})
export class DesktopNavbarComponent {
}
