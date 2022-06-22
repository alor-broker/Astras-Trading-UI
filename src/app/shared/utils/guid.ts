/**
  A class which generates GUIDs
*/
export class GuidGenerator {
  /**
   * A GUID generation method in format supported by .net
   * @return string with GUID
   */
  static newGuid() : string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
