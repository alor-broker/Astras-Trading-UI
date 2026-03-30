import { Injectable, inject } from "@angular/core";
import {ThemeService} from "../../theme.service";
import {AppHook} from "./app-hook-token";

@Injectable()
export class AttachDefaultStylesHook implements AppHook {
  private readonly themeService = inject(ThemeService);

  onInit(): void {
    this.themeService.attachDefaultStyles();
  }

  onDestroy(): void {
    return;
  }
}
