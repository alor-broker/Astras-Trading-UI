import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideChatWidgetComponent } from './widgets/side-chat-widget/side-chat-widget.component';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { NzIconModule } from "ng-zorro-antd/icon";
import { TranslocoModule } from "@ngneat/transloco";
import { ChatContainerComponent } from './components/chat-container/chat-container.component';
import { MessageInputComponent } from './components/message-input/message-input.component';
import { AiChatComponent } from './components/ai-chat/ai-chat.component';
import { ChatStatusComponent } from './components/chat-status/chat-status.component';
import { NzInputModule } from "ng-zorro-antd/input";
import { NzButtonModule } from "ng-zorro-antd/button";
import { FormsModule } from "@angular/forms";
import { ChatMessageContainerComponent } from './components/chat-message-container/chat-message-container.component';
import { TextMessageComponent } from './components/messages/text-message/text-message.component';
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { NzTypographyComponent } from "ng-zorro-antd/typography";
import { TermsOfUseDialogWidgetComponent } from "./widgets/terms-of-use-dialog-widget/terms-of-use-dialog-widget.component";
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from "ng-zorro-antd/modal";
import { ChatSuggestedMessageContainerComponent } from "./components/chat-suggested-message-container/chat-suggested-message-container.component";
import { StartNewConversationButtonComponent } from "./components/start-new-conversation-button/start-new-conversation-button.component";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";

@NgModule({
  declarations: [
    SideChatWidgetComponent,
    ChatContainerComponent,
    MessageInputComponent,
    AiChatComponent,
    ChatStatusComponent,
    ChatMessageContainerComponent,
    TextMessageComponent,
    TermsOfUseDialogWidgetComponent,
    ChatSuggestedMessageContainerComponent,
    StartNewConversationButtonComponent
  ],
  exports: [
    SideChatWidgetComponent
  ],
  imports: [
    CommonModule,
    NzDrawerModule,
    NzIconModule,
    TranslocoModule,
    NzInputModule,
    NzButtonModule,
    FormsModule,
    NzAvatarModule,
    NzTypographyComponent,
    NzModalComponent,
    NzModalContentDirective,
    NzModalFooterDirective,
    NzTooltipDirective
  ]
})
export class AiChatModule {
}
