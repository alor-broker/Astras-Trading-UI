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

  public error(...details: string[]): void {
    console.error(details);
  }
}
