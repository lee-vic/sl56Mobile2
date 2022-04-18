import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ToastController,IonContent } from '@ionic/angular';
import { SignalRConnection, SignalR } from 'ng2-signalr';
import { apiUrl } from 'src/app/global';
import { ProblemService } from 'src/app/providers/problem.service';
import { InstantMessageService } from 'src/app/providers/instant-message.service';

import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
  signalRConnection: SignalRConnection;
  @ViewChild(IonContent,{static:true}) content: IonContent;
  @ViewChild('chat_input',{static:true}) messageInput: ElementRef;
  msgList: any[] = [];
  user: any;
  toUser: any;
  editorMsg = '';
  messages: Array<any> = [];
  receiveGoodsDetailId: number;
  problemId: number;
  serverUrl: string = apiUrl;
  imageURI: any;
  imageFileName: any;
  isConnected: boolean = false;
  attachmentTypeId:string;
  currentEmployeeId:number;
  showFileUploadButton:boolean=false;
  chatGroupId:number;
  /**
   * 0:售前咨询
   * 1:单号消息
   */
  messageType: number;
  constructor(
    private signalR: SignalR,
    public service: ProblemService,
    public imService: InstantMessageService,
    public toastCtrl: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private navCtrl:NavController
    ) {
      this.messageType =parseInt(this.route.snapshot.paramMap.get('id'));
      this.route.queryParams.subscribe(params=>{
        if(this.router.getCurrentNavigation().extras.state){
          let data=this.router.getCurrentNavigation().extras.state;
          this.receiveGoodsDetailId=data.receiveGoodsDetailId;
          this.problemId = data.problemId;
          this.messages = data.messages;
          this.attachmentTypeId=data.attachmentTypeId;
        }
        if(this.messageType==1){
          this.showFileUploadButton=true;
        }
        else if(this.messageType==2&&this.attachmentTypeId!=undefined){
          this.showFileUploadButton=true;
        }
        this.processMessages();
      });
    
    
   

  }
  ngOnDestroy(): void {
    this.signalRConnection.stop();
  }
  ngOnInit(): void {
    console.log("now.init");
    this.signalRConnection = this.signalR.createConnection();
    this.signalRConnection.status.subscribe((p) => {
      console.warn(p.name);
      if (p.name == "connected") {
        this.isConnected = true;
        this.multiMarkIsSend();
      }
      else {
        this.isConnected = false;
      }
    });
    this.signalRConnection.start().then((c) => {
      let listener = c.listenFor("messageReceived");
      listener.subscribe((msg: any) => {
        let obj = JSON.parse(msg);
        if(obj.ShowType==1)
          return;
        //撤回消息
        if(obj.MsgType==6){
          let revokeMsgId = obj.MsgContent;
          let revokeMessage = this.messages.find(p=>p.Id==revokeMsgId);
          if(revokeMessage!=null)
            revokeMessage.IsRevoke=true;
        }
        else if(obj.MsgType==7){

        }
        else if(obj.MsgType==8){

        }
        else if(obj.MsgType==9){

        }
        else{
          this.currentEmployeeId=obj.MsgFrom;
          this.appendMessage(obj);
        }
        
      });
    });
    if (this.messageType == 0) {
      this.imService.getMessages2().subscribe(res => {
        this.messages = res.Data;
        this.chatGroupId=res.ChatGroupId;
        this.processMessages();
      })
    }
    else if (this.messageType == 1 && this.messages == undefined) {
      this.imService.getMessages3(this.receiveGoodsDetailId,this.chatGroupId).subscribe(res => {
        this.messages = res.Data;
        this.chatGroupId=res.ChatGroupId;
        this.processMessages();
      });
    }
  }
  appendMessage(obj: any) {
    let content = "";
    if (obj.IsFile == true)
      content = obj.FileName;
    else
      content = obj.MsgContent;
    let type=1;
    if(obj.SenderName.indexOf("[客户]")!=-1)
    {
      obj.SenderName="我";
      type=0;
    }
    this.pushNewMsg(content, type, obj.SenderName, obj.IsFile, obj.ObjectId, obj.AtUserName,obj.RefContent,false);
    this.signalRConnection.invoke("markRead", this.chatGroupId);
  }

  multiMarkIsSend() {
    if (this.messages != undefined && this.messages.length > 0 && this.isConnected == true) {
        this.signalRConnection.invoke("markRead", this.chatGroupId);
    }
  }
  processMessages() {
    if (this.messages != undefined) {
      this.messages.forEach(element => {
        if (element.Type === 1) {
          element.avatar = "assets/imgs/chat-1.png";
        }
        else {
          element.avatar = "assets/imgs/chat-2.png";
          element.Name = "我";
        }
      });
    }
    this.scrollToBottom();
    this.multiMarkIsSend();
  }

  ionViewDidLoad() {
    this.scrollToBottom();
  }
  sendMsg() {
    if (!this.editorMsg.trim()) return;
    console.log("conn:",this.signalRConnection);
    this.signalRConnection.invoke("sendToGroup", this.editorMsg, null,null,this.chatGroupId,null,null,null).then((data: any) => {
      console.log("sendMsgResult:",data);
      if(!isNaN(parseInt(data))){
        this.pushNewMsg(this.editorMsg, 0, "", false, data, null,null,false);
        this.editorMsg = '';
      }else{
        alert("发送失败,请尝试刷新页面后重试；错误信息："+ data);
      }
    });

  }
  onFocus() {

    //this.content.
    this.scrollToBottom();
  }
  scrollToBottom() {
    setTimeout(() => {
      if (this.content.scrollToBottom) {
        this.content.scrollToBottom();
      }
    }, 400)
  }
  /**
   * 
   * @param msg 消息内容
   * @param type -1：会话转接 0：客户发给内部职员；1：内部职员发送给客户
   * @param username 发送消息方姓名
   */
  pushNewMsg(msg: string, type: number, username: string, isFile: boolean, objectId: number, atUserName:string,refContent:string,isRevoke:boolean) {
    if (username == "")
      username = "我";
    let obj: any = {
      Content: msg,
      Date: (new Date()).toLocaleString(),
      Name: username,
      Type: type,
      IsFile: isFile,
      Id: objectId,
      AtUserName: atUserName,
      RefContent:refContent,
      IsRevoke:isRevoke
    };
    if (type == 1) {
      obj.avatar = "assets/imgs/chat-1.png";
    }
    else {
      obj.avatar = "assets/imgs/chat-2.png";
    }
 
    this.messages.push(obj);
    this.scrollToBottom();
  }
  upload(files) {
    if (files.length === 0)
      return;

    const formData = new FormData();

    for (let file of files)
      formData.append(file.name, file);
    if(this.messageType==1){
      this.service.upload1(formData).subscribe(res => {
        if(res.Success==true){
          this.sendFileMsg(res);
        }
        else{
          this.toastCtrl.create({
            message: "上传失败,错误信息:"+res.Text,
            position: 'middle',
            duration: 1500
          }).then(p=>p.present());
        }
      });
    }
    else if(this.messageType==2){
      formData.append("filetype",this.attachmentTypeId);
      formData.append("receiveGoodsDetailId",this.receiveGoodsDetailId.toString());
      this.service.upload(formData).subscribe(res => {
        if(res.Success==true){
          this.sendFileMsg(res);
        }
        else{
         this.toastCtrl.create({
            message: "上传失败,错误信息:"+res.Text,
            position: 'middle',
            duration: 3000
          }).then(p=>p.present());
        
        }
      });
    }
   
  }
  sendFileMsg(res:any) {
    this.signalRConnection.invoke("sendToGroup", res.Path, res.Name, res.FileSize,this.chatGroupId,null,null,null).then((data: any) => {
      console.log("sendFileMsgResult:",data);
      if(!isNaN(parseInt(data))){
        this.pushNewMsg(res.Name,0,"",true,data,null,null,false);
      }else{
        alert("发送失败,请尝试刷新页面后重试；错误信息："+ data);
      }
      
    });
  }

  isCanProcessBySelf(message){
    let pattern = /(?<=自助处理.).*/g;
    let isMatch = pattern.test(message.Content);
    if(isMatch)
    {
      let rgdIdPattern=/(?<=Detail\?id=)\d+/;
      let problemIdPattern=/(?<=ProblemId=)\d+/;
      let rgdId=message.Content.match(rgdIdPattern)[0];
      let problemId=message.Content.match(problemIdPattern)[0];
      let now = Date.now();
      let result={
        processMessage:message.Content.replace(pattern,""),
        rgdId:rgdId,
        problemId:problemId
      }
      return result;
    }
  }

  processProblem(result){
    this.navCtrl.navigateForward("/member/problem-detail/"+result.rgdId,
    {
      queryParams:
      {
        problemid:result.problemId
      },
      replaceUrl:true//为保证问题详情与聊天界面之间跳转时数据正常刷新，这两个页面互相跳转时，不保存历史状态
    });
  }
 
}
