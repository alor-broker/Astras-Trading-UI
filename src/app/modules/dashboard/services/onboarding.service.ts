import { Injectable, inject } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { LocalStorageDesktopConstants } from "../../../shared/constants/local-storage.constants";
import { TranslatorService } from "../../../shared/services/translator.service";
import { take } from "rxjs";

interface Profile {
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private readonly joyride = inject(JoyrideService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly translatorService = inject(TranslatorService);

  start(): void {
    if (!this.getIsCompleted()) {
      this.translatorService.getTranslator('')
        .pipe(
          take(1)
        )
        .subscribe(t => setTimeout(() => {
            this.joyride.startTour({
              steps: Array(10).fill(1).map((n, i) => `step${i + 1}`),
              themeColor: 'rgba(0, 155, 99, 1)',
              customTexts: {
                prev: t(['joyride', 'prev']),
                next: t(['joyride', 'next']),
                done: t(['joyride', 'done'])
              }
            });
            this.setIsCompleted(true);
          }, 5000)
        );
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
