import {HashMap} from '@jsverse/transloco/lib/utils/type.utils';

export type TranslatorFn = (key: string[], params?: HashMap) => string;
