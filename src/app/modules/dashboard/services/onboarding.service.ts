import {Injectable} from '@angular/core';
import {JoyrideService} from 'ngx-joyride';
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import { LocalStorageConstants } from "../../../shared/constants/local-storage.constants";

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  protected isCompleted = false;

  constructor(
    private readonly joyride: JoyrideService,
    private readonly localStorage: LocalStorageService
  ) {
    this.isCompleted = this.getIsCompleted();
  }

  start(): void {
    if (!this.isCompleted) {
      const interval = setInterval(() => {
        this.joyride.startTour({
          steps: Array(7).fill(1).map((n, i) => `step${i + 1}`),
          themeColor: 'rgba(0, 155, 99, 1)'
        });
        this.setIsCompleted(true);

        clearInterval(interval);
      }, 5000);
    }
  }

  private getProfile(): any {
    return this.localStorage.getItem<any>(LocalStorageConstants.ProfileStorageKey);
  }

  private getIsCompleted(): boolean {
    const profile = this.getProfile() as { isCompleted: boolean } | undefined;
    if (profile) {
      return profile.isCompleted;
    }
    return false;
  }

  private setIsCompleted(isCompleted: boolean): void {
    const profile = {
      ...this.getProfile(),
      isCompleted
    } as { [propName: string]: any, isCompleted: boolean };

    this.localStorage.setItem(LocalStorageConstants.ProfileStorageKey, profile);
  }
}
