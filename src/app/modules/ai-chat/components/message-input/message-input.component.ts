import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from '@angular/core';

export interface OutcomingMessage {
  text: string;
}

@Component({
  selector: 'ats-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.less']
})
export class MessageInputComponent {
  @ViewChild('inputElement', { static: true })
  inputElement!: ElementRef<HTMLInputElement>;

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
  }
}
