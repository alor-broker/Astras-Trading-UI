import {
  BasicInformation,
  CurrencyInformation,
  FinancialAttributes,
  TradingDetails
} from "../../../../generated/graphql.types";
import { Descriptor } from "../models/instrument-descriptors.model";
import { getTypeByCfi } from "../../../shared/utils/instruments";

export class DescriptorFiller {
  static basicInformation(input: {
    basicInformation: BasicInformation;
    financialAttributes: FinancialAttributes;
    currencyInformation: CurrencyInformation;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [
      {
        id: 'description',
        formattedValue: input.basicInformation.description,
        customStyles: {
          'font-size': '8pt'
        }
      }
    ];

    if (input.financialAttributes.isin != null) {
      descriptors.push({
        id: 'isin',
        formattedValue: input.financialAttributes.isin!
      });
    }

    if (input.currencyInformation.nominal != null) {
      descriptors.push({
        id: 'baseCurrency',
        formattedValue: input.currencyInformation.nominal!
      });
    }

    if (input.financialAttributes.cfiCode != null) {
      const type = getTypeByCfi(input.financialAttributes.cfiCode);
      descriptors.push({
        id: 'instrumentType',
        formattedValue: type,
        valueTranslationKey: 'instrumentTypeOptions.' + type,
      });
    }

    return descriptors;
  }

  static tradingDetails(input: {
    currencyInformation: CurrencyInformation;
    tradingDetails: TradingDetails;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if(input.tradingDetails.lotSize > 0) {
      descriptors.push({
        id: 'lotSize',
        formattedValue: input.tradingDetails.lotSize.toString()
      });
    }

    if(input.tradingDetails.minStep > 0) {
      descriptors.push({
        id: 'minStep',
        formattedValue: input.tradingDetails.minStep.toString(),
      });
    }

    if(input.tradingDetails.priceStep > 0) {
      descriptors.push({
        id: 'priceStep',
        formattedValue: input.tradingDetails.priceStep.toString(),
      });
    }

    if (input.currencyInformation.settlement != null) {
      descriptors.push({
        id: 'priceStepCurrency',
        formattedValue: input.currencyInformation.settlement!
      });
    }

    return descriptors;
  }
}
