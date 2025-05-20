import { BarsRequest } from '../../modules/light-chart/models/bars-request.model';

export class ChartSubscriptionIdHelper {
  static getCandleSubscriptionId: (request: BarsRequest) => string = request =>
    `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.tf}_${request.from}_${request.format}`;
}
