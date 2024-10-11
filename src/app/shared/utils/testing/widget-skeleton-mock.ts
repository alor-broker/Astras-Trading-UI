import { ComponentHelpers } from "./component-helpers";

export const widgetSkeletonMock = ComponentHelpers.mockComponent({
  selector: 'ats-widget-skeleton',
  inputs: ['content', 'header', 'settings', 'showContentScroll', 'showSettings', 'isBlockWidget']
});
