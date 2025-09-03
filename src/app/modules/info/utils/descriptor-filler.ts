import {
  AdditionalInformation,
  BasicInformation,
  BoardInformation,
  CurrencyInformation,
  FinancialAttributes,
  TradingDetails
} from "../../../../generated/graphql.types";
import { Descriptor } from "../models/instrument-descriptors.model";
import { getTypeByCfi } from "../../../shared/utils/instruments";
import { formatNumber } from "@angular/common";
import { InstrumentType } from "../../../shared/models/enums/instrument-type.model";

export class DescriptorFiller {
  static basicInformation(input: {
    basicInformation: BasicInformation;
    boardInformation: BoardInformation;
    financialAttributes: FinancialAttributes;
    currencyInformation: CurrencyInformation;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [{
      id: 'shortName',
      formattedValue: input.basicInformation.shortName
    },
      {
        id: 'exchange',
        formattedValue: input.basicInformation.exchange
      },
      {
        id: 'board',
        formattedValue: input.boardInformation.board
      }
    ];

    if (input.boardInformation.primaryBoard !== input.boardInformation.board) {
      descriptors.push({
        id: 'primaryBoard',
        formattedValue: input.boardInformation.primaryBoard
      });
    }

    if (input.financialAttributes.isin != null) {
      descriptors.push({
        id: 'isin',
        formattedValue: input.financialAttributes.isin!
      });
    }

    descriptors.push(
      {
        id: 'description',
        formattedValue: input.basicInformation.fullDescription,
        customStyles: {
          'font-size': '8pt'
        }
      }
    );

    if (input.financialAttributes.cfiCode != null) {
      const type = getTypeByCfi(input.financialAttributes.cfiCode);

      if (type !== InstrumentType.Other) {
        descriptors.push({
          id: 'instrumentType',
          formattedValue: type,
          valueTranslationKey: 'instrumentTypeOptions.' + type,
        });
      }
    } else if (input.basicInformation.type != null && input.basicInformation.type.length > 0) {
      descriptors.push({
        id: 'instrumentType',
        formattedValue: input.basicInformation.type
      });
    }

    descriptors.push({
      id: 'market',
      formattedValue: input.basicInformation.market
    });

    if(input.financialAttributes.tradingStatusInfo != null) {
      descriptors.push({
        id: 'tradingStatusInfo',
        formattedValue: input.financialAttributes.tradingStatusInfo
      });
    }

    return descriptors;
  }

  static currencyInformation(currencyInformation: CurrencyInformation): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if(currencyInformation.nominal != null) {
      descriptors.push({
        id: 'currencyNominal',
        formattedValue: currencyInformation.nominal
      });
    }

    if(currencyInformation.settlement != null) {
      descriptors.push({
        id: 'currencySettlement',
        formattedValue: currencyInformation.settlement
      });
    }

    return descriptors;
  }

  static tradingParameters(input: {
    currencyInformation: CurrencyInformation;
    tradingDetails: TradingDetails;
    locale: string;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [];

    if (input.tradingDetails.lotSize > 0) {
      descriptors.push({
        id: 'lotSize',
        formattedValue: input.tradingDetails.lotSize.toString()
      });
    }

    if (input.tradingDetails.minStep > 0) {
      descriptors.push({
        id: 'minStep',
        formattedValue: formatNumber(input.tradingDetails.minStep, input.locale, '0.0-10'),
      });
    }

    if (input.tradingDetails.priceStep > 0) {
      descriptors.push({
        id: 'priceStep',
        formattedValue: formatNumber(input.tradingDetails.priceStep, input.locale, '0.0-10'),
      });
    }

    descriptors.push({
      id: 'rating',
      formattedValue: formatNumber(input.tradingDetails.rating, input.locale, '0.0-10'),
    });

    return descriptors;
  }

  static tradingData(input: {
    tradingDetails: TradingDetails;
    locale: string;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [];

    descriptors.push({
      id: 'priceMax',
      formattedValue: formatNumber(input.tradingDetails.priceMax, input.locale, '0.0-10'),
    });

    descriptors.push({
      id: 'priceMin',
      formattedValue: formatNumber(input.tradingDetails.priceMin, input.locale, '0.0-10'),
    });

    descriptors.push({
      id: 'tradeVolume',
      formattedValue: formatNumber(input.tradingDetails.tradeVolume, input.locale, '0.0-10'),
    });

    descriptors.push({
      id: 'dailyGrowthPercent',
      formattedValue: formatNumber(input.tradingDetails.dailyGrowthPercent, input.locale, '0.0-3'),
    });

    descriptors.push({
      id: 'dailyGrowth',
      formattedValue: formatNumber(input.tradingDetails.dailyGrowth, input.locale, '0.0-10'),
    });

    descriptors.push({
      id: 'price',
      formattedValue: formatNumber(input.tradingDetails.price, input.locale, '0.0-10'),
    });

    return descriptors;
  }

  static additionalInformation(input: {
    additionalInfo: AdditionalInformation;
    locale: string;
  }): Descriptor[] {
    const descriptors: Descriptor[] = [];

    const cancellationDate = new Date(input.additionalInfo.cancellation);
    if(cancellationDate.getFullYear() < 3000) {
      descriptors.push({
        id: 'cancellationDate',
        formattedValue: cancellationDate.toLocaleDateString()
      });
    }

    if(input.additionalInfo.priceMultiplier !== 1) {
      descriptors.push({
        id: 'priceMultiplier',
        formattedValue: formatNumber(input.additionalInfo.priceMultiplier, input.locale, '0.0-10'),
      });
    }

    if(input.additionalInfo.priceShownUnits !== 1) {
      descriptors.push({
        id: 'priceShownUnits',
        formattedValue: formatNumber(input.additionalInfo.priceShownUnits, input.locale, '0.0-10'),
      });
    }

    return descriptors;
  }
}
