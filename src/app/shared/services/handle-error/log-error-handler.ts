import { ApplicationErrorHandler } from "./error-handler";
import { HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { LoggerService } from '../logging/logger.service';
import { GraphQLError } from "graphql";

@Injectable()
export class LogErrorHandler implements ApplicationErrorHandler {
  constructor(private readonly logger: LoggerService) {
  }

  handleError(error: Error | HttpErrorResponse | GraphQLError): void {
    this.logger.error('[General Error]', error);
  }
}
