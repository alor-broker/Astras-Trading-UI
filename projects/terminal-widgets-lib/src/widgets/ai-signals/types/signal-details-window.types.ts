import {SubmitOrderContext} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {SignalRowViewModel} from './ai-signals-view.types';

export interface SignalDetailsWindowData {
  signal: SignalRowViewModel;
  submitOrderContext: SubmitOrderContext | null;
}
