import {
  TranslocoMissingHandler,
  TranslocoMissingHandlerData
} from '@jsverse/transloco';
import {HashMap} from '@jsverse/transloco/lib/utils/type.utils';


export class MissingTranslationsHandler implements TranslocoMissingHandler {
  handle(key: string, data: TranslocoMissingHandlerData, params?: HashMap): string {
    return (params?.["fallback"] ?? '') as string;
  }
}
