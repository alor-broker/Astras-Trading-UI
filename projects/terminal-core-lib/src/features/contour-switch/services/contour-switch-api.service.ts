import {
  inject,
  Injectable
} from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import {
  map,
  Observable
} from 'rxjs';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  ContourActivationResult,
  ContourActivationResultStatus,
  ContourErrorCode,
  ContourErrorResponse,
  ContourStatusResponse,
  SwitchCooldownErrorResponse
} from '../types/contour-switch.types';

@Injectable({
  providedIn: 'root'
})
export class ContourSwitchApiService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly contourUrl = `${this.coreApiUrlProvider.apiUrl}/client/contour`;

  getStatus(): Observable<ContourStatusResponse | null> {
    return this.httpClient.get<ContourStatusResponse>(this.contourUrl).pipe(
      catchHttpError<ContourStatusResponse | null>(null)
    );
  }

  activateCurrentContour(): Observable<ContourActivationResult> {
    return this.httpClient.post<ContourStatusResponse>(`${this.contourUrl}/actions/activate`, null).pipe(
      map(response => ({
        status: ContourActivationResultStatus.Success,
        response
      }) as ContourActivationResult),
      catchHttpError<ContourActivationResult>(error => ({
        status: ContourActivationResultStatus.Error,
        error: this.toContourErrorResponse(error)
      }))
    );
  }

  private toContourErrorResponse(error: HttpErrorResponse): ContourErrorResponse | SwitchCooldownErrorResponse | null {
    if (this.isContourErrorResponse(error.error)) {
      return error.error;
    }

    if (typeof error.error === 'string') {
      try {
        const parsedError: unknown = JSON.parse(error.error);

        return this.isContourErrorResponse(parsedError)
          ? parsedError
          : null;
      } catch {
        return null;
      }
    }

    return null;
  }

  private isContourErrorResponse(error: unknown): error is ContourErrorResponse | SwitchCooldownErrorResponse {
    return typeof error === 'object' &&
      error != null &&
      'code' in error &&
      Object.values(ContourErrorCode).includes(error.code as ContourErrorCode);
  }
}
