import {
  Component,
  Input
} from '@angular/core';
import { SelectClientPortfolioBtnComponent } from "../../../../admin/components/select-client-portfolio-btn/select-client-portfolio-btn.component";

@Component({
  selector: 'ats-admin-clients',
  standalone: true,
  imports: [
    SelectClientPortfolioBtnComponent
  ],
  templateUrl: './admin-clients.component.html',
  styleUrl: './admin-clients.component.less'
})
export class AdminClientsComponent {
  @Input({required: true})
  guid!: string;
}
