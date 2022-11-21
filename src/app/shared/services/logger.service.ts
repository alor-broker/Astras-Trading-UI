import { Injectable } from "@angular/core";
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  public info(message: string): void {
    console.info(message);
  }

  public trace(message: string): void {
    if (!environment.production) {
      console.trace(message);
    }
  }

  public warn(...details: string[]): void {
    console.warn(details);
  }

  public error(message: string, error?: Error): void {
    console.error(message, error);
  }
}
