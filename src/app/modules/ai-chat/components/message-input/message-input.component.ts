import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {FormsModule} from '@angular/forms';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';

export interface OutcomingMessage {
  text: string;
}

@Component({
  selector: 'ats-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.less'],
  imports: [
    NzInputDirective,
    FormsModule,
    NzButtonComponent,
    NzIconDirective
  ]
})
export class MessageInputComponent {
  @ViewChild('inputElement', {static: true})
  inputElement!: ElementRef<HTMLTextAreaElement>;

  @Input()
  atsDisabled = false;

  @Input()
  text = '';

  @Input()
  messagePlaceholder = '';

  @Input()
  messageMaxLength = 2000;

  @Output()
  send = new EventEmitter<OutcomingMessage>();

  sendMessage(): void {
    if (this.text.length > 0) {
      this.send.emit({
        text: this.text
      });

      this.setText('');
      this.inputElement.nativeElement.blur();
    }
  }

  onTextChange(value: string): void {
    this.setText(value);
  }

  private setText(text: string): void {
    this.text = text.slice(0, this.messageMaxLength);

    if (this.inputElement.nativeElement.value !== this.text) {
      this.inputElement.nativeElement.value = this.text;
    }

    this.inputElement.nativeElement.style.height = 'auto';
    this.inputElement.nativeElement.style.height = this.inputElement.nativeElement.scrollHeight + 'px';
  }
}
