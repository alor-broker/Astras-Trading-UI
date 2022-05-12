import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { buyColor } from 'src/app/shared/models/settings/styles-constants';

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private betaFlagStorage = 'beta';
  private profileStorage = 'profile';
  private isCompleted = false;

  constructor(private readonly joyride: JoyrideService) {
    this.isCompleted = this.getIsCompleted();
  }

  start() {
    if (!this.isCompleted) {
      const interval = setInterval(() => {
        let isBetaAccepted = localStorage.getItem(this.betaFlagStorage);
        if (isBetaAccepted) {
          this.joyride.startTour({
            steps: Array(8).fill(1).map((_, i) => `step${i + 1}`),
            themeColor: buyColor
          });
          this.setIsCompleted(true);
          clearInterval(interval);
        }
      }, 5000);
    }
  }

  private getProfile() {
    const json = localStorage.getItem(this.profileStorage);
    if (json) {
      let profile = JSON.parse(json);
      return profile;
    }
    return null;
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

    localStorage.setItem(this.profileStorage, JSON.stringify(profile));
  }
}
