export enum FileType {
  Csv = 'csv'
}

export interface FileMeta {
  name: string;
  fileType: FileType;
}

export class FileSaver {
  public static save(fileMeta: FileMeta, content: string) {
    const blob = new Blob([content], { "type": "text/" + fileMeta.fileType + ";charset=utf8;" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);

    link.setAttribute('visibility', 'hidden');
    link.download = `${fileMeta.name}.${this.getExtension(fileMeta.fileType)}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static getExtension(fileType: FileType) {
    switch (fileType) {
      case FileType.Csv:
        return 'csv';
      default:
        return 'txt';
    }
  }
}
