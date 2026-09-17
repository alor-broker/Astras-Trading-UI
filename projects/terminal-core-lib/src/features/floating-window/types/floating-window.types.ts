import {DestroyRef, Injector, TemplateRef, Type} from '@angular/core';
import type {FloatingWindowRef} from '../services/floating-window-ref';

export enum FloatingWindowPolicy {
  Multiple = 'multiple',
  OnePerGroup = 'one-per-group',
  OneOverall = 'one-overall'
}

export enum FloatingWindowAction {
  Ok = 'ok',
  Cancel = 'cancel'
}

export enum FloatingWindowEdge {
  North = 'n',
  South = 's',
  East = 'e',
  West = 'w',
  NorthEast = 'ne',
  NorthWest = 'nw',
  SouthEast = 'se',
  SouthWest = 'sw'
}

export interface FloatingWindowPoint {
  x: number;
  y: number;
}

export interface FloatingWindowRect extends FloatingWindowPoint {
  width: number;
  height: number;
}

export interface FloatingWindowTemplateContext<D = unknown, R = unknown> {
  $implicit: D;
  window: FloatingWindowRef<D, R>;
}

export interface FloatingWindowOptions<D = unknown, R = unknown> {
  data: D;
  title?: string | TemplateRef<FloatingWindowTemplateContext<D, R>>;
  ariaLabel?: string;
  footer?: TemplateRef<FloatingWindowTemplateContext<D, R>> | null;
  panelClass?: string;
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  origin?: FloatingWindowPoint;
  offsetX?: number;
  offsetY?: number;
  draggable?: boolean;
  resizable?: boolean;
  fullScreen?: boolean;
  closable?: boolean;
  keyboard?: boolean;
  /** Highlight the border on activation. Enabled by default. */
  highlightOnActivate?: boolean;
  okText?: string;
  cancelText?: string;
  okDisabled?: boolean;
  cancelDisabled?: boolean;
  okLoading?: boolean;
  cancelLoading?: boolean;
  onOk?: (ref: FloatingWindowRef<D, R>) => boolean | void | Promise<boolean | void>;
  onCancel?: (ref: FloatingWindowRef<D, R>) => boolean | void | Promise<boolean | void>;
}

export interface FloatingWindowOpenOptions<D = unknown, R = unknown> extends FloatingWindowOptions<D, R> {
  id?: string;
  groupId?: string;
  policy?: FloatingWindowPolicy;
  injector: Injector;
  owner: DestroyRef;
}

export type FloatingWindowContent<D = unknown, R = unknown> = Type<unknown> | TemplateRef<FloatingWindowTemplateContext<D, R>>;
