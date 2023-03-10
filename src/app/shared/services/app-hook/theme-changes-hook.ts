import {AppHook} from "./app-hook-token";
import {Injectable} from "@angular/core";
import {ThemeService} from "../theme.service";
import {Subscription} from "rxjs";

@Injectable()
export class ThemeChangesHook implements AppHook {
  private themeChangeSubscription?: Subscription;

  constructor(private readonly themeService: ThemeService) {
  }

  onDestroy(): void {
    this.themeChangeSubscription?.unsubscribe();
  }

  onInit(): void {
    this.themeChangeSubscription = this.themeService.subscribeToThemeChanges();
  }

}
