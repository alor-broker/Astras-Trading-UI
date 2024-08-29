import {
  Component,
  OnInit
} from '@angular/core';
import { LocalStorageService } from "../../../../shared/services/local-storage.service";
import { LocalStorageSsoConstants } from "../../../../shared/constants/local-storage.constants";

@Component({
  selector: 'ats-external-logout',
  templateUrl: './external-logout.component.html',
  styleUrls: ['./external-logout.component.less']
})
export class ExternalLogoutComponent implements OnInit {
  constructor(private readonly localStorageService: LocalStorageService) {
  }

  ngOnInit(): void {
    // This component is activated from sso page. It should end current session when user send logout in other browser tab.
    // Logout logic is implemented in AuthService based on localStorage event.
    this.localStorageService.removeItem(LocalStorageSsoConstants.TokenStorageKey);
  }
}
