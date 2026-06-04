import {BlotterWidgetSettings} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {BaseColumnSettings} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {
  CsvFormatter,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from '@terminal-core-lib/common/utils/files/csv-formatter';
import {
  FileSaver,
  FileType
} from '@terminal-core-lib/common/utils/files/file-saver';

export class ExportHelper {
  public static exportToCsv<T>(
    fileSuffix: string,
    blotterSettings: BlotterWidgetSettings,
    data: T[],
    columns: BaseColumnSettings<T>[],
    valueTranslators?: Map<string, (value: unknown) => string>,
  ): void {
    const meta = columns.map(c => ({
        title: c.displayName,
        readFn: item => {
          const value = (item as Record<string, unknown>)[c.id];
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
