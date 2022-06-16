import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { buyColor } from 'src/app/shared/models/settings/styles-constants';
import { LocalStorageService } from "../../../shared/services/local-storage.service";

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private profileStorage = 'profile';
  private isCompleted = false;

  constructor(
    private readonly joyride: JoyrideService,
    private readonly localStorage: LocalStorageService
  ) {
    this.isCompleted = this.getIsCompleted();
  }

  start() {
    if (!this.isCompleted) {
      const interval = setInterval(() => {
        this.joyride.startTour({
          steps: Array(8).fill(1).map((_, i) => `step${i + 1}`),
          themeColor: buyColor
        });
        this.setIsCompleted(true);
        clearInterval(interval);
      }, 5000);
    }
  }

  private getProfile() {
    return this.localStorage.getItem<any>(this.profileStorage);
  }

  private getIsCompleted() : boolean {
    const profile = this.getProfile();
    if (profile) {
      return profile.isCompleted;
    }
    return false;
  }

  private setIsCompleted(isCompleted: boolean) {
    const profile =  {
      ...this.getProfile(),
      isCompleted
    };

    this.localStorage.setItem(this.profileStorage, profile);
  }
}
