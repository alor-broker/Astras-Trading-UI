import { BarsRequest } from '../../modules/light-chart/models/bars-request.model';
import { QuotesRequest } from '../models/quotes/quotes-request.model';

export class ChartSubscriptionIdHelper {
  static getCandleSubscriptionId: (request: BarsRequest) => string = request =>
    `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.tf}_${request.from}_${request.format}`;

  static getQuotesSubscriptionId: (request: QuotesRequest) => string = request =>
    `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.format}`;
}
