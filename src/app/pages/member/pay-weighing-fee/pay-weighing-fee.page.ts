import { NavController, LoadingController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { CookieService } from "ngx-cookie-service";
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';
import { SignalR, SignalRConnection } from 'ng2-signalr';
import { Subscription } from 'rxjs';

@Component({
  selector: "app-pay-weighing-fee",
  templateUrl: "./pay-weighing-fee.page.html",
  styleUrls: ["./pay-weighing-fee.page.scss"],
})
export class PayWeighingFeePage implements OnInit {
  openId: string;
  weights: Array<WeightBill> = [];
  showMsg = "";
  signalRConnection: SignalRConnection;
  signalRConnected: boolean = false;
  vehicleNo: string = "";
  subscriber: Subscription;
  constructor(
    private cookieService: CookieService,
    private weightBillService: WeightBillService,
    private navController: NavController,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private signalR: SignalR,
    public toastController: ToastController,
    public actionSheetController: ActionSheetController
  ) { }

  ngOnInit(): void {
    this.openId = this.cookieService.get("OpenId");
    this.signalRConnection = this.signalR.createConnection();
    this.signalRConnection.status.subscribe((p) => console.log(p.name));

  }
  loadList() {
    this.loadingCtrl.create({
      message: "请稍后",
    })
      .then((lc) => {
        lc.present();
        this.weightBillService.getList(this.openId).subscribe((p) => {
          this.weights = p;
          lc.dismiss();
          if (this.weights.length == 0) {
            this.showMsg = "暂无称重记录";
          }
        });
      });
  }
  ionViewDidEnter() {
    this.loadList();
    this.signalRConnection.start().then((c) => {
      this.signalRConnected = true;
      //监听读数服务读数已完毕的事件
      let listener = c.listenFor("messageReceived");

      if (this.subscriber != undefined)
        this.subscriber.unsubscribe();
      this.subscriber = listener.subscribe((msg: any) => {
        let obj = JSON.parse(msg);
        console.log(obj);
        if (obj.MsgContent == "Complete") {
          //通知读数服务停止读取数据
          let sendData = {
            MsgFrom: 16075,
            FromClientType: 1,
            MsgFromType: 0,
            MsgTo: 1,
            ToClientType: 13,
            MsgToType: 1,
            MsgContent: "Stop",
            InvokeClassName: this.openId,
            InvokeMethodName: this.vehicleNo
          };
          this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
            this.loadingCtrl.dismiss();
            this.detail(parseInt(obj.InvokeClassName));
          })
        }
      });
    });
  }
  ionViewWillLeave() {
    this.signalRConnection.stop();
    this.signalRConnected = false;
  }

  detail(objectId) {
    let options: NavigationOptions = {
      queryParams: {
        ObjectId: objectId,
        OpenId: this.openId,
      },
    };
    this.navController.navigateForward(
      "/member/pay-weighing-fee/detail",
      options
    );
  }

  start() {
    this.weightBillService.getHistoryVehicleNo(this.openId).subscribe(vehicleNoList => {
      if (vehicleNoList.length == 0) {
        this.getInputVehicleNo();
      }
      else {
        var vehicleNoButtons = [];
        vehicleNoList.forEach(element => {
          vehicleNoButtons.push({
            text: element,
            handler: () => {
              this.startRead(element);
            }
          });
        });
        vehicleNoButtons.push({
          text: "输入其它车牌号码",
          handler: () => {
            this.getInputVehicleNo();
          }
        });
        vehicleNoButtons.push({
          text: "取消",
          role: "cancel",
          handler: () => {

          }
        });
        this.actionSheetController.create({
          header: "车牌号码历史记录",
          subHeader: "请选择",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: vehicleNoButtons
        }).then(p => p.present());
      }
    });

  }
  startRead(inputVehicleNo: string) {
    this.vehicleNo = inputVehicleNo;
    this.loadingCtrl.create({
      message: '正在发起请求,请稍后...'
    }).then(p => p.present());
    this.weightBillService.start(this.openId, this.vehicleNo)
      .subscribe(started => {
        this.loadingCtrl.dismiss();
        console.log(typeof (started));
        console.log(started);
        if (started == true) {
          this.loadingCtrl.create({
            message: '正在测量,请稍后...'
          }).then(p => p.present());
        }
        else {
          this.alertController.create({
            header: '启动失败',
            subHeader:"非常抱歉，系统遇到了问题",
            message:"请联系系统管理员！",
            backdropDismiss:false,
            keyboardClose:false,
            buttons: [
              {
                text: '确定',
                role: 'cancel'
              }
            ]
          }).then(p=>p.present());
          return false;
        }
      }, err => {
        this.loadingCtrl.dismiss();
        console.log(err);
        this.alertController.create({
          header: '启动失败',
          subHeader:"非常抱歉，系统遇到了问题",
          message:"请联系系统管理员！",
          backdropDismiss:false,
          keyboardClose:false,
          buttons: [
            {
              text: '确定',
              role: 'cancel'
            }
          ]
        }).then(p=>p.present());
      });
  }
  getInputVehicleNo() {
    this.alertController.create({
      header: '请输入车牌号码',
      backdropDismiss: false,
      keyboardClose: false,
      inputs: [{
        name: 'vehicleNo',
        type: 'text',
        placeholder: '请输入完整车牌号码,不区分大小写'
      }],
      buttons: [{
        text: "取消",
        role: 'cancel'
      }, {
        text: "确定",
        handler: (data) => {
          if (data.vehicleNo == "" || data.vehicleNo.length < 7) {
            this.toastController.create({
              position: "middle",
              message: '请输入正确的车牌号码',
              duration: 2000
            }).then(p => p.present());
            return false;
          }
          else {
            this.startRead(data.vehicleNo);
          }
        }
      }]
    }).then(p => p.present());
  }
  ngOnDestroy(): void {
    this.signalRConnection.stop();
  }
}
