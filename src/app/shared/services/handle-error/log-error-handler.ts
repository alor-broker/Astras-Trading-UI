import { ApplicationErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { LoggerService } from "../logger.service";
import { Injectable } from "@angular/core";

@Injectable()
export class LogErrorHandler implements ApplicationErrorHandler {
  constructor(private readonly logger: LoggerService) {
  }

  handleError(error: Error | HttpErrorResponse) {
    this.logger.error('[General Error]', error);
  }
}
