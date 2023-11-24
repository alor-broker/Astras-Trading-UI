import {
  CsvFormatter,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from "../../../shared/utils/file-export/csv-formatter";
import {
  FileSaver,
  FileType
} from "../../../shared/utils/file-export/file-saver";
import { BlotterSettings } from '../models/blotter-settings.model';
import { BaseColumnSettings } from "../../../shared/models/settings/table-settings.model";

export class ExportHelper {
  public static exportToCsv<T>(
    fileSuffix: string,
    blotterSettings: BlotterSettings,
    data: T[],
    columns: BaseColumnSettings<T>[],
    valueTranslators?: Map<string, (value: any) => string>,
  ): void {
    const meta = columns.map(c => ({
        title: c.displayName,
        readFn: item => {
          const value = (item as { [propName: string]: unknown})[c.id];
          const translator = valueTranslators?.get(c.id);
          if (translator && !!value) {
            return translator(value);
          }
          return value;
        }
      } as ExportColumnMeta<T>)
    );

    const csv = CsvFormatter.toCsv(meta, data, csvFormatterConfigDefaults);

    FileSaver.save({
        fileType: FileType.Csv,
        name: `${blotterSettings.portfolio}(${blotterSettings.exchange})_${fileSuffix}`
      },
      csv);
  }
}
