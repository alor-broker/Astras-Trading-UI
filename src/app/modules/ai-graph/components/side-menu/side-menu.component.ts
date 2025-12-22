import {Component, ContentChild, HostBinding, input, model} from '@angular/core';
import {animate, state, style, transition, trigger} from "@angular/animations";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NgClass, NgTemplateOutlet} from "@angular/common";
import {SideMenuTitleDirective} from "../../directives/side-menu-title.directive";
import {SideMenuContentDirective} from "../../directives/side-menu-content.directive";

export interface MenuWidth {
  widthPercent: number;
  minWidthPx: number;
}

@Component({
  selector: 'ats-side-menu',
  imports: [
    NzIconDirective,
    NgClass,
    NgTemplateOutlet
  ],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.less',
  animations: [
    trigger('openCloseLeft', [
      state('open', style({transform: 'translateX(0)', opacity: 1})),
      state('closed', style({display: 'none', opacity: 0})),
      transition('closed => open', [
        style({transform: 'translateX(-100%)'}),
        animate(150)
      ]),
      transition('open => closed', [
        animate(150)
      ]),
    ]),
    trigger('openCloseRight', [
      state('open', style({transform: 'translateX(0)', opacity: 1})),
      state('closed', style({display: 'none', opacity: 0})),
      transition('closed => open', [
        style({transform: 'translateX(100%)'}),
        animate(150)
      ]),
      transition('open => closed', [
        animate(150)
      ]),
    ]),
  ]
})
export class SideMenuComponent {
  readonly position = input<'left' | 'right'>('left');

  readonly closable = input(true);

  readonly visible = model(false);

  readonly menuWidth = input<MenuWidth>({
    widthPercent: 20,
    minWidthPx: 350
  });

  @ContentChild(SideMenuTitleDirective)
  title?: SideMenuTitleDirective;

  @ContentChild(SideMenuContentDirective)
  content?: SideMenuContentDirective;

  @HostBinding('class.left')
  get left(): boolean {
    return this.position() === 'left';
  }

  @HostBinding('class.right')
  get right(): boolean {
    return this.position() === 'right';
  }

  @HostBinding('style.width')
  get width(): string {
    return `${this.menuWidth().widthPercent}%`;
  }

  @HostBinding('style.min-width')
  get minWidth(): string {
    return `${this.menuWidth().minWidthPx}px`;
  }

  @HostBinding('@openCloseLeft')
  get openCloseLeft(): string {
    if (this.position() !== 'left') {
      return '';
    }

    return this.visible() ? 'open' : 'closed';
  }

  @HostBinding('@openCloseRight')
  get openCloseRight(): string {
    if (this.position() !== 'right') {
      return '';
    }

    return this.visible() ? 'open' : 'closed';
  }

  close(): void {
    this.visible.set(false);
  }
}
