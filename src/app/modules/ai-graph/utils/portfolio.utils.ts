import {Portfolio} from "../graph/slot-types";
import {ArrayItemsSeparator} from "../constants/graph-data.constants";
import { MarketType } from "../../../shared/models/portfolio-key.model";

export class PortfolioUtils {
  private static readonly Separator = ':';

  /**
   * Converts a string representation of a portfolio ('portfolio:exchange') to a PortfolioKey object
   * @param value String representation of a portfolio
   * @returns PortfolioKey object
   */
  static fromString(value: string): Portfolio {
    const parts = value.split(this.Separator);

    return {
      portfolio: parts[0] ?? '',
      exchange: parts[1] ?? '',
      agreement: parts[2] ?? '',
      market: (parts[3] ?? null) as (MarketType | null)
    };
  }

  /**
   * Converts a PortfolioKey object to its string representation ('portfolio:exchange')
   * @param portfolio PortfolioKey object
   * @returns String representation of the portfolio
   */
  static toString(portfolio: Portfolio): string {
    return [
      portfolio.portfolio,
      portfolio.exchange,
      portfolio.agreement,
      portfolio.market
    ].join(this.Separator);
  }

  /**
   * Converts an array of PortfolioKey objects to a single string representation
   * @param portfolios Array of PortfolioKey objects
   * @returns String representation of the portfolio array
   */
  static fromArrayToString(portfolios: Portfolio[]): string {
    return portfolios.map(p => this.toString(p))
      .join(ArrayItemsSeparator);
  }

  /**
   * Checks if a string contains multiple portfolios (separated by ArrayItemsSeparator)
   * @param value String to check
   * @returns Boolean indicating if the string contains multiple portfolios
   */
  static isArray(value: string): boolean {
    return value.includes(ArrayItemsSeparator);
  }

  /**
   * Converts a string representation of multiple portfolios to an array of PortfolioKey objects
   * @param value String representation of multiple portfolios
   * @returns Array of PortfolioKey objects or null if invalid
   */
  static fromStringToArray(value: string): Portfolio[] | null {
    if (value.length === 0 || !this.isArray(value)) {
      return null;
    }

    return value.split(ArrayItemsSeparator)
      .map(p => this.fromString(p));
  }
}
