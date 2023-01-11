import { Injectable } from '@angular/core';
import marketSettings from '../../../assets/marketSettings.json';
import { ExchangeSettings, MarketSettings } from "../models/market-settings.model";

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  getExchangeSettings(exchange: string): ExchangeSettings {
    return (marketSettings as any)[exchange];
  }

  getMarketSettings(exchange: string, market: string): MarketSettings {
    return (marketSettings as any)[exchange].market[market];
  }
}
