import {Component, ElementRef, input, model, output, viewChild} from '@angular/core';
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
  readonly inputElement = viewChild.required<ElementRef<HTMLTextAreaElement>>('inputElement');

  readonly atsDisabled = input(false);

  readonly text = model('');

  readonly messagePlaceholder = input('');

  readonly messageMaxLength = input(2000);

  readonly send = output<OutcomingMessage>();

  sendMessage(): void {
    if (this.text().length > 0) {
      this.send.emit({
        text: this.text()
      });

      this.setText('');
      this.inputElement().nativeElement.blur();
    }
  }

  onTextChange(value: string): void {
    this.setText(value);
  }

  private setText(text: string): void {
    this.text.set(text.slice(0, this.messageMaxLength()));

    const textValue = this.text();

    const inputElement = this.inputElement();
    if (inputElement.nativeElement.value !== textValue) {
      inputElement.nativeElement.value = textValue;
    }

    inputElement.nativeElement.style.height = 'auto';
    inputElement.nativeElement.style.height = inputElement.nativeElement.scrollHeight + 'px';
  }
}
