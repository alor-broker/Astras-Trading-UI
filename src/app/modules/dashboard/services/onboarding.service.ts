import { Injectable } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { LocalStorageDesktopConstants } from "../../../shared/constants/local-storage.constants";

interface Profile {
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {

  constructor(
    private readonly joyride: JoyrideService,
    private readonly localStorage: LocalStorageService
  ) {}

  start(): void {
    if (!this.getIsCompleted()) {
      const interval = setInterval(() => {
        this.joyride.startTour({
          steps: Array(8).fill(1).map((n, i) => `step${i + 1}`),
          themeColor: 'rgba(0, 155, 99, 1)'
        });
        this.setIsCompleted(true);

        clearInterval(interval);
      }, 5000);
    }
  }

  private getProfile(): Profile | undefined {
    return this.localStorage.getItem<Profile>(LocalStorageDesktopConstants.ProfileStorageKey);
  }

  private getIsCompleted(): boolean {
    const profile = this.getProfile();
    if (profile) {
      return profile.isCompleted;
    }
    return false;
  }

  private setIsCompleted(isCompleted: boolean): void {
    const profile = {
      ...this.getProfile(),
      isCompleted
    };

    this.localStorage.setItem(LocalStorageDesktopConstants.ProfileStorageKey, profile);
  }
}
