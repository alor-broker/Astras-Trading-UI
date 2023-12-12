export class NewYearHelper {
  static showNewYearIcon(): boolean {
    const today = new Date();

    // display New Year icon from 1 December to 13 January
    return today.getMonth() === 11 || (today.getMonth() === 0 && today.getDate() < 14);
  }
}
