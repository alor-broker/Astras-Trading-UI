import {Injectable} from "@angular/core";
import {ThemeService} from "../../theme.service";
import {AppHook} from "./app-hook-token";

@Injectable()
export class AttachDefaultStylesHook implements AppHook {
  constructor(
    private readonly themeService: ThemeService
  ) {
  }

  onInit(): void {
    this.themeService.attachDefaultStyles();
  }

  onDestroy(): void {
    return;
  }
}
