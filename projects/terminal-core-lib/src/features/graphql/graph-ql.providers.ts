import {Provider} from '@angular/core';
import {GraphQlService} from './services/graph-ql.service';

export function provideGraphQl(): Provider {
  return GraphQlService;
}
