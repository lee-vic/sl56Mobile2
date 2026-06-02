import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { IonContent, AlertController } from '@ionic/angular';
import { SignalRConnection, SignalR } from 'src/app/providers/signal-r.service';
import { apiUrl } from 'src/app/global';
import { ProblemService } from 'src/app/providers/problem.service';
import { InstantMessageService } from 'src/app/providers/instant-message.service';

import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
declare var baguetteBox: any;
@Component({
  selector: "app-chat",
  templateUrl: "./chat.page.html",
  styleUrls: ["./chat.page.scss"],
})
export class ChatPage implements OnInit, OnDestroy, AfterViewInit {
  signalRConnection: SignalRConnection;
  @ViewChild(IonContent, { static: true }) content: IonContent;
  @ViewChild("chat_input", { static: true }) messageInput: ElementRef;
  msgList: any[] = [];
  user: any;
  toUser: any;
  editorMsg = "";
  messages: Array<any> = [];
  receiveGoodsDetailId: number;
  problemId: number;
  serverUrl: string = apiUrl;
  imageURI: any;
  imageFileName: any;
  isConnected: boolean = false;
  attachmentTypeId: string;
  currentEmployeeId: number;
  showFileUploadButton: boolean = false;
  chatGroupId: number;
  showScrollBottomButton: boolean = false;
  /**
   * 0:售前咨询
   * 1:单号消息
   */
  messageType: number;
  private hasShownConnectionToast: boolean = false;
  private readonly destroy$ = new Subject<void>();
  private connectionStatusSub?: Subscription;
  private messageReceivedSub?: Subscription;
  private routeQueryParamsSub?: Subscription;
  constructor(
    private signalR: SignalR,
    public service: ProblemService,
    public imService: InstantMessageService,
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private alertController:AlertController,
    private uiFeedbackService: UiFeedbackService
  ) {
    this.messageType = parseInt(this.route.snapshot.paramMap.get("id"));
    this.routeQueryParamsSub = this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((_params) => {
      const nav = this.router.getCurrentNavigation();
      const data = (nav && nav.extras && nav.extras.state) || window.history.state;
      if (
        data &&
        (data.receiveGoodsDetailId != undefined ||
          data.problemId != undefined ||
          data.messages != undefined ||
          data.attachmentTypeId != undefined)
      ) {
        this.receiveGoodsDetailId = data.receiveGoodsDetailId;
        this.problemId = data.problemId;
        this.messages = data.messages;
        this.attachmentTypeId = data.attachmentTypeId;
      }
      if (this.messageType == 1) {
        this.showFileUploadButton = true;
      } else if (this.messageType == 2 && this.attachmentTypeId != undefined) {
        this.showFileUploadButton = true;
      }
      this.processMessages();
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.routeQueryParamsSub) {
      this.routeQueryParamsSub.unsubscribe();
    }
    if (this.connectionStatusSub) {
      this.connectionStatusSub.unsubscribe();
    }
    if (this.messageReceivedSub) {
      this.messageReceivedSub.unsubscribe();
    }
    if (this.signalRConnection) {
      this.signalRConnection.stop();
    }
  }
  ngOnInit(): void {
    console.log("now.init");
    this.signalRConnection = this.signalR.createConnection();
    this.connectionStatusSub = this.signalRConnection.status.subscribe((p) => {
      console.warn(p.name);
      if (p.name == "connected") {
        this.isConnected = true;
        this.hasShownConnectionToast = false;
        this.multiMarkIsSend();
      } else {
        this.isConnected = false;
      }
    });
    this.signalRConnection.start().then((c) => {
      let listener = c.listenFor("messageReceived");
      this.messageReceivedSub = listener.subscribe((msg: any) => {
        let obj: any = null;
        try {
          obj = typeof msg === "string" ? JSON.parse(msg) : msg;
        } catch (e) {
          return;
        }
        if (!obj || typeof obj !== "object") return;
        if (obj.MsgType == undefined || obj.SenderName == undefined) return;
        console.log("收到新消息：",obj);
        if (obj.ShowType == 1) return;
        //撤回消息
        if (obj.MsgType == 6) {
          let revokeMsgId = obj.MsgContent;
          let revokeMessage = this.messages.find((p) => p.Id == revokeMsgId);
          if (revokeMessage != null) revokeMessage.IsRevoke = true;
        } else if (obj.MsgType == 7) {
        } else if (obj.MsgType == 8) {
        } else if (obj.MsgType == 9) {
        } else {
          this.currentEmployeeId = obj.MsgFrom;
          this.appendMessage(obj);
        }
      });
    }).catch(() => {
      this.showConnectionUnavailableToast();
    });
    if (this.messageType == 0) {
      this.imService.getMessages2().pipe(takeUntil(this.destroy$)).subscribe((res) => {
        this.messages = res.Data;
        this.chatGroupId = res.ChatGroupId;
        this.processMessages();
      });
    } else if (this.messageType == 1 && this.messages == undefined) {
      this.imService
        .getMessages3(this.receiveGoodsDetailId, this.chatGroupId)
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          this.messages = res.Data;
          this.chatGroupId = res.ChatGroupId;
          this.processMessages();
        });
    }
  }
  appendMessage(obj: any) {
    let content = "";
    if (obj.IsFile == true)
      content = obj.FileName;
    else content = obj.MsgContent;
    let type = 1;
    if (obj.SenderName.indexOf("[客户]") != -1) {
      obj.SenderName = "我";
      type = 0;
    }
    this.pushNewMsg(
      content,
      type,
      obj.SenderName,
      obj.IsFile,
      obj.ObjectId,
      obj.AtUserName,
      obj.RefContent,
      false
    );
    this.signalRConnection.invoke(
      "markRead",
      this.chatGroupId,
      this.signalRConnection.getConnectionId()
    );
  }

  multiMarkIsSend() {
    if (
      this.messages != undefined &&
      this.messages.length > 0 &&
      this.isConnected == true
    ) {
      this.signalRConnection.invoke(
        "markRead",
        this.chatGroupId,
        this.signalRConnection.getConnectionId()
      );
    }
  }
  processMessages() {
    if (this.messages != undefined) {
      this.messages.forEach((element) => {
        if (element.Type === 1) {
          element.avatar = "assets/imgs/chat-1.png";
        } else {
          element.avatar = "assets/imgs/chat-2.png";
          element.Name = "我";
        }
      });
    }
    this.scrollToBottom();
    this.multiMarkIsSend();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }
  sendMsg() {
    if (!this.canSendMessage()) return;
    console.log("conn:", this.signalRConnection);
    this.signalRConnection
      .invoke(
        "sendToGroup",
        this.editorMsg,
        null,
        null,
        this.chatGroupId,
        null,
        null,
        null
      )
      .then((data: any) => {
        console.log("sendMsgResult:", data);
        if (!isNaN(parseInt(data))) {
          this.pushNewMsg(
            this.editorMsg,
            0,
            "",
            false,
            data,
            null,
            null,
            false
          );
          this.editorMsg = "";
        } else {
          alert("发送失败,请尝试刷新页面后重试；错误信息：" + data);
        }
      })
      .catch(() => {
        this.uiFeedbackService.presentToast('消息发送失败，请稍后重试', 1500, 'middle');
      });
  }

  canSendMessage(): boolean {
    return !!this.editorMsg && this.editorMsg.trim().length > 0;
  }

  handleInputKeydown(event: KeyboardEvent) {
    if (event.isComposing || event.keyCode === 229) {
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMsg();
    }
  }

  shouldShowDateSeparator(index: number): boolean {
    if (!this.messages || index < 0 || index >= this.messages.length) {
      return false;
    }
    if (index === 0) {
      return true;
    }

    const currentDate = this.parseMessageDate(this.messages[index]?.Date);
    const previousDate = this.parseMessageDate(this.messages[index - 1]?.Date);
    if (!currentDate || !previousDate) {
      return false;
    }

    return currentDate.toDateString() !== previousDate.toDateString();
  }

  getDateLabel(dateValue: string): string {
    const messageDate = this.parseMessageDate(dateValue);
    if (!messageDate) {
      return dateValue || '';
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const messageStart = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const dayDiff = Math.round((todayStart.getTime() - messageStart.getTime()) / 86400000);

    if (dayDiff === 0) {
      return '今天';
    }
    if (dayDiff === 1) {
      return '昨天';
    }

    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0');
    const day = messageDate.getDate().toString().padStart(2, '0');
    return messageDate.getFullYear() + '-' + month + '-' + day;
  }

  private parseMessageDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/-/g, '/');
    const parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  private showConnectionUnavailableToast() {
    if (this.hasShownConnectionToast) return;
    this.hasShownConnectionToast = true;
    this.uiFeedbackService.presentToast('实时消息服务暂不可用，系统正在尝试重连', 1800, 'middle');
  }
  onFocus() {
    //this.content.
    this.scrollToBottom();
  }
  scrollToBottom() {
    if (!this.content || !this.content.scrollToBottom) {
      return;
    }
    setTimeout(() => {
      if (this.content.scrollToBottom) {
        this.content.scrollToBottom();
        this.showScrollBottomButton = false;
      }
    }, 400);
  }

  onContentScroll(event: any) {
    const scrollTop = event?.detail?.scrollTop || 0;
    this.showScrollBottomButton = scrollTop > 260;
  }

  scrollToBottomManual() {
    if (!this.content || !this.content.scrollToBottom) {
      return;
    }
    this.content.scrollToBottom(280);
    this.showScrollBottomButton = false;
  }
  /**
   *
   * @param msg 消息内容
   * @param type -1：会话转接 0：客户发给内部职员；1：内部职员发送给客户
   * @param username 发送消息方姓名
   */
  pushNewMsg(
    msg: string,
    type: number,
    username: string,
    isFile: boolean,
    objectId: number,
    atUserName: string,
    refContent: string,
    isRevoke: boolean
  ) {
    if (username == "") username = "我";
    let fileType = null;
    if (isFile) {
      let extension = msg.substring(msg.lastIndexOf(".") + 1).toUpperCase();
      if (extension.indexOf("JPG") != -1 || extension.indexOf("PNG")!=-1)
        fileType = "pic";
      else if (extension.indexOf("DOC") != -1)
        fileType = "word";
      else if (extension.indexOf("XLS") != -1)
        fileType = "excel";
      else if (extension.indexOf("PDF") != -1)
        fileType = "pdf";
      else
        fileType = "unknow";
    }
    let obj: any = {
      Content: msg,
      Date: new Date().toLocaleString(),
      Name: username,
      Type: type,
      IsFile: isFile,
      Id: objectId,
      AtUserName: atUserName,
      RefContent: refContent,
      IsRevoke: isRevoke,
      FileType:fileType
    };
    if (type == 1) {
      obj.avatar = "assets/imgs/chat-1.png";
    } else {
      obj.avatar = "assets/imgs/chat-2.png";
    }

    this.messages.push(obj);
    this.scrollToBottom();
  }
  upload(files) {
    if (files.length === 0) return;

    const formData = new FormData();

    for (let file of files) formData.append(file.name, file);
    if (this.messageType == 1) {
      this.service.upload1(formData).subscribe((res) => {
        if (res.Success == true) {
          this.sendFileMsg(res);
        } else {
          this.uiFeedbackService.presentToast('上传失败,错误信息:' + res.Text, 1500, 'middle');
        }
      });
    } else if (this.messageType == 2) {
      formData.append("filetype", this.attachmentTypeId);
      formData.append(
        "receiveGoodsDetailId",
        this.receiveGoodsDetailId.toString()
      );
      this.service.upload(formData).subscribe((res) => {
        if (res.Success == true) {
          this.sendFileMsg(res);
        } else {
          this.uiFeedbackService.presentToast('上传失败,错误信息:' + res.Text, 3000, 'middle');
        }
      });
    }
  }
  sendFileMsg(res: any) {
    this.signalRConnection
      .invoke(
        "sendToGroup",
        res.Path,
        res.Name,
        res.FileSize,
        this.chatGroupId,
        null,
        null,
        null
      )
      .then((data: any) => {
        console.log("sendFileMsgResult:", data);
        if (!isNaN(parseInt(data))) {
          this.pushNewMsg(res.Name, 0, "", true, data, null, null, false);
        } else {
          alert("发送失败,请尝试刷新页面后重试；错误信息：" + data);
        }
      });
  }

  isCanProcessBySelf(message) {
    let keyWord = "自助处理";
    let keyWordIndex = message.Content.indexOf(keyWord);
    if (keyWordIndex != -1) {
      let rgdIdPattern = /id=\w+/;
      let problemIdPattern = /ProblemId=\w+/;
      let rgdId = null;
      let problemId = null;
      if (rgdIdPattern.test(message.Content)) {
        rgdId = message.Content.match(rgdIdPattern)[0].split("=")[1];
      }
      if (problemIdPattern.test(message.Content)) {
        problemId = message.Content.match(problemIdPattern)[0].split("=")[1];
      }
      let result = {
        processMessage: message.Content.replace(/<a.*自助处理/g, ""),
        rgdId: rgdId,
        problemId: problemId,
      };
      return result;
    }
  }

  processProblem(result) {
    this.router.navigate(["/member/problem-detail/" + result.rgdId], {
      queryParams: {
        problemid: result.problemId,
      },
      replaceUrl: true, // 为保证问题详情与聊天界面之间跳转时数据正常刷新，这两个页面互相跳转时，不保存历史状态
    });
  }

  async showImage(id) {
    const safeId = encodeURIComponent(String(id ?? ""));
    const alert = await this.alertController.create({
      header: "",
      message:
        "<ion-img src='"+this.serverUrl+"/DeliveryRecord/ChatFile?id="+safeId+"'></ion-img>",
      cssClass:"alert-image",
      buttons: [],
    });

    await alert.present();
  }
}
