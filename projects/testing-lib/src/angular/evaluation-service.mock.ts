import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';

export interface EvaluationServiceMock {
  evaluateOrder: ReturnType<typeof vi.fn>;
}

export interface EvaluationServiceMockResult {
  service: EvaluationServiceMock;
  provider: Provider;
}

export class EvaluationServiceMockFactory {
  static create(): EvaluationServiceMockResult {
    const service: EvaluationServiceMock = {
      evaluateOrder: vi.fn().mockReturnValue(of(null))
    };

    return {
      service,
      provider: {provide: EvaluationService, useValue: service}
    };
  }
}
