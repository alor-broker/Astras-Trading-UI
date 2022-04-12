import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  public info(message: string): void {
    console.info(message);
  }

  public trace(message: string): void {
    console.trace(message);
  }

  public warn(...details: string[]): void {
    console.warn(details);
  }

  public error(message: string, error?: Error): void {
    console.error(message, error);
  }
}
