import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ToastController,IonContent } from '@ionic/angular';
import { SignalRConnection, SignalR } from 'ng2-signalr';
import { apiUrl } from 'src/app/global';
import { ProblemService } from 'src/app/providers/problem.service';
import { InstantMessageService } from 'src/app/providers/instant-message.service';

import { ActivatedRoute, Router } from '@angular/router';

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
    private route: ActivatedRoute
    ) {
      this.messageType =parseInt(this.route.snapshot.paramMap.get('id'));
      this.route.queryParams.subscribe(params=>{
        if(this.router.getCurrentNavigation().extras.state){
          let data=this.router.getCurrentNavigation().extras.state;
          this.receiveGoodsDetailId=data.receiveGoodsDetailId;
          this.problemId = data.problemId;
          this.messages = data.messages;
          this.attachmentTypeId=data.attachmentTypeId;
          console.log(this.attachmentTypeId);
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
        if(obj.MsgType==6){

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
        this.messages = res;
        this.processMessages();
      })
    }
    else if (this.messageType == 1 && this.messages == undefined) {
      this.imService.getMessages3(this.receiveGoodsDetailId).subscribe(res => {
        this.messages = res;
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
    this.pushNewMsg(content, 1, obj.SenderName, obj.IsFile, obj.ObjectId, true);
    this.signalRConnection.invoke("markIsSend", obj.ObjectId);
  }

  multiMarkIsSend() {
    if (this.messages != undefined && this.messages.length > 0 && this.isConnected == true) {
      let idList = new Array<Number>();
      this.messages.forEach((val, idx, array) => {
        if (val.IsSend == false&&val.Type==1) {
          idList.push(val.Id);
        }
      });
      if (idList.length > 0) {
        this.signalRConnection.invoke("multiMarkIsSend", idList.toString());
      }
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

    this.signalRConnection.invoke("sendToEmployee", this.receiveGoodsDetailId, this.editorMsg, 0, "", 0, "",0,null).then((data: any) => {
      this.pushNewMsg(this.editorMsg, 0, "", false, data, true);
      this.editorMsg = '';
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
  pushNewMsg(msg: string, type: number, username: string, isFile: boolean, objectId: number, isSned: boolean) {
    if (username == "")
      username = "我";
    let obj: any = {
      Content: msg,
      Date: Date.now().toString(),
      Name: username,
      Type: type,
      IsFile: isFile,
      Id: objectId,
      IsSend: isSned
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
    this.signalRConnection.invoke("sendToEmployee", this.receiveGoodsDetailId, res.Path, 1, res.Name, res.FileSize, "",0,null).then((data: any) => {
      console.log(data);
      if(data!=-1){
        this.pushNewMsg(res.Name,0,"",true,data,true);
      }
      
    });
  }
 
}
