import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ThemeService } from '../../../shared/services/theme.service';
import { take } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private profileStorage = 'profile';
  private isCompleted = false;

  constructor(
    private readonly joyride: JoyrideService,
    private readonly localStorage: LocalStorageService,
    private readonly themeService: ThemeService
  ) {
    this.isCompleted = this.getIsCompleted();
  }

  start() {
    if (!this.isCompleted) {
      const interval = setInterval(() => {
        this.themeService.getThemeSettings().pipe(
          take(1)
        ).subscribe(theme => {
          this.joyride.startTour({
            steps: Array(8).fill(1).map((_, i) => `step${i + 1}`),
            themeColor: theme.themeColors.buyColor
          });
          this.setIsCompleted(true);
        });

        clearInterval(interval);
      }, 5000);
    }
  }

  private getProfile() {
    return this.localStorage.getItem<any>(this.profileStorage);
  }

  private getIsCompleted(): boolean {
    const profile = this.getProfile();
    if (profile) {
      return profile.isCompleted;
    }
    return false;
  }

  private setIsCompleted(isCompleted: boolean) {
    const profile = {
      ...this.getProfile(),
      isCompleted
    };

    this.localStorage.setItem(this.profileStorage, profile);
  }
}
