import { ComponentHelpers } from "./component-helpers";

/**
 *  array of ng-zorro mock components
 */
export const ngZorroMockComponents = [
  ComponentHelpers.mockComponent({ selector: 'nz-header', inputs: ['stepContent'] }),
  ComponentHelpers.mockComponent({
    selector: 'nz-table',
    inputs: [
      'nzFrontPagination',
      'nzNoResult',
      'nzShowPagination',
      'nzPaginationType',
      'nzPageSize',
      'nzScroll',
      'nzData',
      'nzLoading',
      'nzWidthConfig',
      'nzVirtualMaxBufferPx',
      'nzVirtualMinBufferPx',
      'nzVirtualForTrackBy',
      'nzVirtualItemSize',
      'nzFooter',
      'atsTableRowHeight'
    ]
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-drawer',
    inputs: [
      'nzClosable',
      'nzVisible',
      'nzPlacement',
      'nzWrapClassName',
      'nzTitle',
      'nzSize',
      'nzContent',
      'nzExtra',
      "nzWidth",
    ]
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-tabset',
    inputs: ['nzSelectedIndex', 'nzAnimated']
  }),
  ComponentHelpers.mockComponent({ selector: 'nz-tab', inputs: ['nzTitle'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-layout' }),
  ComponentHelpers.mockComponent({ selector: 'nz-empty' }),
  ComponentHelpers.mockComponent({ selector: 'nz-content' }),
  ComponentHelpers.mockComponent({
    selector: 'nz-spin',
    inputs: ['nzSpinning', 'nzIndicator', 'nzTip']
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-form-control',
    inputs: ['nzErrorTip', 'nzValidateStatus']
  }),
  ComponentHelpers.mockComponent({ selector: 'nz-collapse', inputs: ['nzBordered'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-collapse-panel', inputs: ['nzHeader'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-form-item' }),
  ComponentHelpers.mockComponent({ selector: 'nz-form-label', inputs: ['nzFor'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-input-group' }),
  ComponentHelpers.mockComponent({
    selector: 'nz-dropdown-menu',
    exportAs: 'nzDropdownMenu',
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-avatar',
    inputs: ['nzSize', 'nzText', 'nzSrc']
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-modal',
    inputs: ['nzCancelText', 'nzVisible', 'nzTitle', 'nzMaskClosable', 'nzOkText']
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-badge',
    inputs: ['nzColor', 'nzText', 'nzDropdownMenu', 'nzPopoverTitle', 'nzOffset', 'nzCount', 'nzPopoverVisible']
  }),
  ComponentHelpers.mockComponent({
    selector: 'nz-calendar',
    inputs: ['nzDateFullCell', 'nzFullscreen', 'nzDisabledDate']
  }, class NzCalendarComponent {
    onMonthSelect(): void {
      return;
    }
  }),
  ComponentHelpers.mockComponent({ selector: 'nz-tag', inputs: ['nzColor', 'nz-tooltip', 'nzTooltipMouseEnterDelay'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-select', inputs: ['ngModel', 'nzMaxTagCount'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-option', inputs: ['nzValue', 'nzLabel'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-divider' }),
  ComponentHelpers.mockComponent({ selector: 'nz-tree', inputs: ['nzData', 'nzTreeTemplate'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-switch' }),
  ComponentHelpers.mockComponent({ selector: 'nz-segmented', inputs: ['nzLabelTemplate', 'nzOptions', 'ngModel'] }),
  ComponentHelpers.mockComponent({ selector: 'nz-button-group' }),
  ComponentHelpers.mockComponent({ selector: 'nz-alert', inputs: ['nzType', 'nzDescription', 'nzCloseable'] }),
  ComponentHelpers.mockDirective({ selector: '[nzGutter]', inputs: ['nzGutter'] }),
  ComponentHelpers.mockDirective({ selector: '[text]', inputs: ['text'] }),
  ComponentHelpers.mockDirective({ selector: '[nzLayout]', inputs: ['nzLayout'] }),
  ComponentHelpers.mockDirective({ selector: '[nzPopoverContent]', inputs: ['nzPopoverContent'] }),
  ComponentHelpers.mockDirective({ selector: '[nzPopoverTitle]', inputs: ['nzPopoverTitle'] }),
  ComponentHelpers.mockDirective({
    selector: '[nz-button]',
    inputs: ['nzDropdownMenu', 'title', 'text', 'nzLoading', 'nzType', 'nzClickHide', 'nzVisible', 'disabled']
  }),
  ComponentHelpers.mockDirective({
    selector: '[nz-icon]',
    inputs: ['title', 'text', 'nzTwotoneColor', 'nzTheme', 'nzType', 'nzRotate']
  }),
  ComponentHelpers.mockDirective({
    selector: '[nz-tooltip]',
    inputs: ['nz-tooltip', 'nzTooltipTitle', 'nzTooltipTrigger', 'nzTooltipPlacement', 'nzTooltipMouseEnterDelay']
  }),
  ComponentHelpers.mockDirective({
    selector: 'th',
    inputs: ['nzWidth', 'nzCustomFilter', 'nzSortFn', 'nzFilters', 'nzShowFilter', 'minWidth', 'nzFilterMultiple']
  }),
  ComponentHelpers.mockDirective({
    selector: '[nz-typography]',
    inputs: ['nzType']
  })
];
