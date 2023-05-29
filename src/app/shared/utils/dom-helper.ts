export class DomHelper {
  static isModalOpen(): boolean {
    return document.querySelector('.ant-modal-wrap') != null;
  }
}
