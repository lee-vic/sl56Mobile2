import { NavController, LoadingController, AlertController, ToastController, ActionSheetController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { CookieService } from "ngx-cookie-service";
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';
import { SignalR, SignalRConnection } from 'ng2-signalr';
import { Subscription } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: "app-pay-weighing-fee",
  templateUrl: "./pay-weighing-fee.page.html",
  styleUrls: ["./pay-weighing-fee.page.scss"],
})
export class PayWeighingFeePage implements OnInit {
  signalRConnection: SignalRConnection;
  signalRConnected: boolean = false;
  subscriber: Subscription;
  public data: WeightBill = new WeightBill();
  tab: number = 1;
  public weightBillForm1: FormGroup;
  validation_messages = {
    "vehicleNo": [
      { type: "required", message: "车牌号码必须输入" },
      { type: "minlength", message: "车牌号码的长度最少为7位" },
      { type: "maxlength", message: "车牌号码的长度最多为8位" }
    ],
    "tareWeight": [
      { type: "required", message: "皮重(车重)必须输入" },
      { type: "min", message: "皮重(车重)必须大于1KG" }
    ],
    "pricePerTon": [
      { type: "required", message: "过磅费选项不能为空" }
    ],
    "corporateAccount": [
      { type: "maxLength", message: "车牌号码的长度最多为32位" }
    ]
  };
  prices: any[] = [
    { value: 0, text: "按实际支付金额" },
    { value: 1, text: "1.0元/吨" },
    { value: 1.5, text: "1.5元/吨" },
    { value: 2, text: "2.0元/吨" },
    { value: 2.5, text: "2.5元/吨" },
    { value: 3, text: "3.0元/吨" },
    { value: 3.5, text: "3.5元/吨" },
    { value: 4, text: "4.0元/吨" }
  ];

  constructor(
    private cookieService: CookieService,
    private weightBillService: WeightBillService,
    private navController: NavController,
    private loadingCtrl: LoadingController,
    private alertController: AlertController,
    private signalR: SignalR,
    public toastController: ToastController,
    public formBuilder: FormBuilder,
    public actionSheetController: ActionSheetController
  ) {
    this.weightBillForm1 = this.formBuilder.group({
      vehicleNo: ['', Validators.compose(
        [
          Validators.required,
          Validators.minLength(7),
          Validators.maxLength(8)
        ]
      )],
      tareWeight: [null],
      pricePerTon: [0,Validators.compose([Validators.required])],
      corporateAccount: [null, Validators.compose(
        [
          Validators.maxLength(32)
        ]
      )],
    });
    this.data.PricePerTon=0;
  }

  ngOnInit(): void {
    this.data.WxOpenId = this.cookieService.get("OpenId");
    this.signalRConnection = this.signalR.createConnection();
    this.signalRConnection.status.subscribe((p) => console.log(p.name));
    this.loadDefaultValue();

  }
  s
  loadDefaultValue() {
    this.loadingCtrl.create({
      message: "请稍后",
    })
      .then((lc) => {
        lc.present();
        this.weightBillService.getWeightBillDefaultValue(this.data.WxOpenId, "").subscribe(result => {
          if (result != null) {
            this.data.VehicleNo = result.VehicleNo;
            this.data.TareWeight = result.TareWeight;
          }
          else {
            this.data.VehicleNo = null;
            this.data.TareWeight = null;
          }
          lc.dismiss();
        }, error => {
          lc.dismiss();
        });
      });
  }

  showHistoryVehicleNo() {
    this.weightBillService.getHistoryVehicleNo(this.data.WxOpenId).subscribe(vehicleNoList => {
      if (vehicleNoList.length == 0) {
        this.alertController.create({
          header: '信息不完整',
          message: "请根据系统的提示完整输入所需信息",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: [
            {
              text: '确定',
              role: 'cancel'
            }
          ]
        }).then(p => p.present());
      }
      else {
        var vehicleNoButtons = [];
        vehicleNoList.forEach(element => {
          vehicleNoButtons.push({
            text: element,
            handler: () => {
              this.setVehicleNo(element);
            }
          });
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
  showInParkVehicleNo() {
    this.weightBillService.getInParkVehicleNo().subscribe(vehicleNoList => {
      if (vehicleNoList.length == 0) {
        this.alertController.create({
          header: '信息不完整',
          message: "请根据系统的提示完整输入所需信息",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: [
            {
              text: '确定',
              role: 'cancel'
            }
          ]
        }).then(p => p.present());
      }
      else {
        var vehicleNoButtons = [];
        vehicleNoList.forEach(element => {
          vehicleNoButtons.push({
            text: element,
            handler: () => {
              this.setVehicleNo(element);
            }
          });
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
  ionViewDidEnter() {
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
            InvokeClassName: this.data.WxOpenId,
            InvokeMethodName: ""
          };
          //需要收费,跳转到支付页面
          if (obj.InvokeMethodName != "0") {
            this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
              this.loadingCtrl.dismiss();
              this.gotoPay(parseInt(obj.InvokeClassName));
            });
          }
          //不需要收费，跳转到磅单页面
          else {
            this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
              this.loadingCtrl.dismiss();
              this.detail(parseInt(obj.InvokeClassName));
            });
          }
        }
        else if (obj.MsgContent == "Timeout") {
          this.loadingCtrl.dismiss();
          this.alertController.create({
            header: '测量失败',
            subHeader: "测量超时",
            message: "请重试！如果重试仍然提示此信息，请联系系统管理员！",
            backdropDismiss: false,
            keyboardClose: false,
            buttons: [
              {
                text: '确定',
                role: 'cancel'
              }
            ]
          }).then(p => p.present());
        }
      });
    });
  }
  ionViewWillLeave() {
    if (this.signalRConnected == true) {
      this.signalRConnection.stop();
      this.signalRConnected = false;
    }
  }

  detail(objectId) {
    let options: NavigationOptions = {
      queryParams: {
        ObjectId: objectId,
        OpenId: this.data.WxOpenId,
      },
    };
    this.navController.navigateForward(
      "/member/pay-weighing-fee/result/" + objectId
    );
  }
  gotoPay(objectId) {
    let options: NavigationOptions = {
      queryParams: {
        ObjectId: objectId,
        OpenId: this.data.WxOpenId,
      },
    };
    this.navController.navigateForward(
      "/member/pay-weighing-fee/detail/" + objectId
    );
  }
  validateweightBillForm1() {
    if (!this.weightBillForm1.valid) {
      for (let i in this.weightBillForm1.controls) {
        this.weightBillForm1.controls[i].markAsTouched()
      }
      return false;
    }
    else
      return true;
  }
  goToHistory() {
    this.navController.navigateForward(
      "/member/weight-bill-list"
    );
  }
  start() {
    if (this.validateweightBillForm1()) {
      if (this.tab == 1 && (this.data.TareWeight == null || this.data.TareWeight == undefined || this.data.TareWeight == 0)) {
        this.alertController.create({
          header: '信息不完整',
          message: "重车模式必须输入皮重",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: [
            {
              text: '确定',
              role: 'cancel'
            }
          ]
        }).then(p => p.present());
      }
      else {
        if (this.tab == 2)
          this.data.TareWeight = 0;
        this.startRead();

      }

    }
    else {
      this.alertController.create({
        header: '信息不完整',
        message: "请根据系统的提示完整输入所需信息",
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [
          {
            text: '确定',
            role: 'cancel'
          }
        ]
      }).then(p => p.present());
    }
  }
  vehicleNoChange(event) {
    if (this.data.VehicleNo != null && this.data.VehicleNo != undefined)
      this.data.VehicleNo = this.data.VehicleNo.toLocaleUpperCase();
    if (this.data.VehicleNo.length >= 7) {
      this.weightBillService.getWeightBillDefaultValue(this.data.WxOpenId, this.data.VehicleNo).subscribe(result => {
        if (result != null) {
          this.data.TareWeight = result.TareWeight;
        }
        else {
          this.data.TareWeight = null;
        }

      }, error => {

      });
    }

  }
  setVehicleNo(val: string) {
    this.weightBillForm1.controls["vehicleNo"].setValue(val);
  }
  startRead() {
    this.loadingCtrl.create({
      message: '正在启动设备,请稍后...'
    }).then(p => p.present());
    //通知读数端开始读数
    this.weightBillService.start(this.data)
      .subscribe(started => {
        this.loadingCtrl.dismiss();
        console.log(typeof (started));
        console.log(started);
        if (started == true) {
          this.loadingCtrl.create({
            message: '测量设备正在测量,请稍后...'
          }).then(p => p.present());

        }
        else {
          this.alertController.create({
            header: '启动失败',
            subHeader: "非常抱歉，系统遇到了问题",
            message: "请联系系统管理员！",
            backdropDismiss: false,
            keyboardClose: false,
            buttons: [
              {
                text: '确定',
                role: 'cancel'
              }
            ]
          }).then(p => p.present());
          return false;
        }
      }, err => {
        this.loadingCtrl.dismiss();
        console.log(err);
        this.alertController.create({
          header: '启动失败',
          subHeader: "启动测量设备请求超时",
          message: "请重试！如果重试仍然提示此信息，请联系系统管理员！",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: [
            {
              text: '确定',
              role: 'cancel'
            }
          ]
        }).then(p => p.present());
      });
  }

  ngOnDestroy(): void {
    this.signalRConnection.stop();
  }
}
