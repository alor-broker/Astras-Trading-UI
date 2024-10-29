import { Component } from '@angular/core';
import { TranslocoDirective } from "@jsverse/transloco";
import { SelectClientPortfolioBtnComponent } from "../select-client-portfolio-btn/select-client-portfolio-btn.component";

@Component({
  selector: 'ats-admin-navbar',
  standalone: true,
  imports: [
    TranslocoDirective,
    SelectClientPortfolioBtnComponent
  ],
  templateUrl: './admin-navbar.component.html',
  styleUrl: './admin-navbar.component.less'
})
export class AdminNavbarComponent {

}
