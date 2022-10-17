import { Injectable } from '@angular/core';
import packageJson from '../../../../../package.json';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import {
  merge,
  of,
  shareReplay,
  Subject
} from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApplicationMetaService {
  private readonly update$ = new Subject();
  private readonly versionStorageKey = 'version';
  readonly savedVersion$ = merge(of({}), this.update$)
    .pipe(
      map(() => {
        return this.localStorageService.getItem<string>(this.versionStorageKey) ?? null;
      }),
      shareReplay(1)
    );

  constructor(private readonly localStorageService: LocalStorageService) {
  }

  get currentVersion(): string {
    return packageJson.version;
  }

  updateCurrentVersion() {
    this.localStorageService.setItem<string>(this.versionStorageKey, this.currentVersion);
    this.update$.next({});
  }
}
