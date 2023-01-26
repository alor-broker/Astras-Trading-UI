import { Column } from "../models/column.model";
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

export class ExportHelper {
  public static exportToCsv<T, F>(
    fileSuffix: string,
    blotterSettings: BlotterSettings,
    data: T[],
    columns: Column<T, F>[],
    valueTranslators?: Map<string, (value: any) => string>,
  ) {
    const meta = columns.map(c => ({
        title: c.name,
        readFn: item => {
          let value = (item as any)[c.id];
          const translator = valueTranslators?.get(c.id);
          if (translator && !!value) {
            return translator(value);
          }
          return value;
        },
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
