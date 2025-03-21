export enum FileType {
  Csv = 'csv',
  Txt = 'txt',
  Json = 'json',
}

export interface FileMeta {
  name: string;
  fileType: FileType;
}

export class FileSaver {
  public static save(fileMeta: FileMeta, content: string): void {
    const blob = new Blob([content], { "type": "text/" + fileMeta.fileType + ";charset=utf8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    link.setAttribute('visibility', 'hidden');
    link.download = `${fileMeta.name}.${this.getExtension(fileMeta.fileType)}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static getExtension(fileType: FileType): string {
    switch (fileType) {
      case FileType.Csv:
        return 'csv';
      case FileType.Json:
        return 'json';
      default:
        return 'txt';
    }
  }
}
