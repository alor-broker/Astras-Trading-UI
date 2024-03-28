import { DefaultTableFilters } from "../models/settings/table-settings.model";
import { GraphQlFilter, GraphQlFilters } from "../models/graph-ql.model";

interface FieldsMapping {
  [parentField: string]: string[];
}

export class GraphQlHelper {
  // Parse applied filters to graphQL filters
  static parseFilters(filters: DefaultTableFilters, nestedFields: FieldsMapping, filterTypes: FieldsMapping): GraphQlFilters {
    const parsedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, key) => {
        const parentField = Object.keys(nestedFields)
          .find(k =>
            key.endsWith('From')
              ? nestedFields[k].includes(key.replace('From', ''))
              : key.endsWith('To')
                ? nestedFields[k].includes(key.replace('To', ''))
                : nestedFields[k].includes(key)
          );

        if (parentField == null) {
          return acc;
        }

        const filterValue = this.getFilterValue(filterTypes, key, filters[key]!);

        if (filterValue == null) {
          return acc;
        }

        if (parentField === 'rootFields') {
          acc.push(filterValue);
        } else {
          acc.push({
            [parentField]: filterValue
          });
        }

        return acc;
      }, [] as (GraphQlFilter | GraphQlFilters)[]);

    return {
      and: parsedFilters
    };
  }

  private static getFilterValue(
    fieldTypes: FieldsMapping,
    filterName: string,
    filterValue: string | string[] | boolean | number
  ): GraphQlFilter | GraphQlFilters | null {
    const filterType = Object.keys(fieldTypes).find(key => fieldTypes[key].includes(filterName));

    if (filterType === 'multiSelect') {
      return {
        or: (filterValue as string[]).map(value => ({ [filterName]: { eq: value } }))
      };
    }

    if (filterType === 'interval') {
      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: Number(filterValue) } };
      }
      return { [filterName.replace('To', '')]: { lte: Number(filterValue) } };
    }

    if (filterType === 'bool') {
      return { [filterName]: { eq: filterValue }};
    }

    if (filterType === 'date') {
      const [day, month, year] = (filterValue as string).split('.').map(d => +d);
      const filterDate = new Date(year, month - 1, day);

      if (isNaN(filterDate.getTime())) {
        return null;
      }

      const parsedDate = filterDate.toISOString();

      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: parsedDate } };
      }
      return { [filterName.replace('To', '')]: { lte: parsedDate } };
    }

    return { [filterName]: { contains: filterValue }};
  }
}
