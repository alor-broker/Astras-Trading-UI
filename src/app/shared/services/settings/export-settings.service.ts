import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

export interface SettingsExportToFileResult {
  filename: string;
  content: string;
}

export interface ExportSettingsService {
  exportToFile(): Observable<SettingsExportToFileResult>;
}

export const EXPORT_SETTINGS_SERVICE_TOKEN = new InjectionToken<ExportSettingsService>('ExportSettingsService');
