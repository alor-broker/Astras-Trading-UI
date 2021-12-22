import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LightChartSettings } from '../../../shared/models/settings/light-chart-settings.model';

@Injectable({
  providedIn: 'root'
})
export class LightChartService {
  settings$!: Observable<LightChartSettings>;
  setSettings(settings: LightChartSettings) {
    throw new Error('Method not implemented.');
  }

  constructor() { }
}
