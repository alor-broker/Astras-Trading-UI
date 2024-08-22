import {
  Component,
  OnInit
} from '@angular/core';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { LocalStorageSsoConstants } from "../../../../shared/constants/local-storage.constants";

@Component({
  selector: 'ats-external-logout-2',
  standalone: true,
  imports: [],
  templateUrl: './external-logout-2.component.html',
  styleUrl: './external-logout-2.component.less'
})
export class ExternalLogout2Component implements OnInit {
  constructor(private readonly localStorageService: LocalStorageService) {
  }

  ngOnInit(): void {
    this.localStorageService.removeItem(LocalStorageSsoConstants.TokenStorageKey);
  }
}
