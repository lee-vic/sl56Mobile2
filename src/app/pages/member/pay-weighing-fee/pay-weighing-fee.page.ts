import { NavController, LoadingController, AlertController, ToastController, ActionSheetController, IonInput } from '@ionic/angular';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CookieService } from "ngx-cookie-service";
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { NavigationOptions } from '@ionic/angular/dist/providers/nav-controller';
import { SignalR, SignalRConnection } from 'ng2-signalr';
import { Subscription } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

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
  public weightBillForm1: FormGroup;
  isMiniProgram: boolean = false;//是否在小程序内运行
  @ViewChild('vehicleNoInput', { static: true }) vehicleNoInput: IonInput;
  //车牌输入框获得焦点是是否自动显示车辆入场记录
  autoShowInparkHistory: boolean = false;
  validation_messages = {
    "vehicleNo": [
      { type: "required", message: "车牌号码必须输入" },
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
    ],
    "isReturn": [

    ]
  };
  prices: any[] = [
    { value: 0, text: "自定义" },
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
    public actionSheetController: ActionSheetController,
    private titleService: Title
  ) {
    this.weightBillForm1 = this.formBuilder.group({
      vehicleNo: ['', Validators.compose(
        [
          Validators.required,
          Validators.maxLength(8)
        ]
      )],
      tareWeight: [null],
      pricePerTon: [0, Validators.compose([Validators.required])],
      corporateAccount: [null, Validators.compose(
        [
          Validators.maxLength(32)
        ]
      )],
      isReturn: [null]
    });
    this.data.PricePerTon = 0;
    this.data.WeighingMode = 0;
  }

  ngOnInit(): void {
    this.titleService.setTitle("丰树地磅");
    //微信小程序
    // if (window.navigator.userAgent.indexOf("miniProgram") != -1) {
      this.isMiniProgram = true;
      this.data.WxOpenId = this.cookieService.get("OpenId");
      this.signalRConnection = this.signalR.createConnection();
      this.signalRConnection.status.subscribe((p) => console.log(p.name));
      this.loadDefaultValue();
      this.alertController.create({
        header: '系统升级提示',
        message: "尊贵的客户，现过磅系统升级为微信小程序，可在微信下拉快速打开过磅小程序，无需下车完成过磅。我们将持续优化升级，为您提供更方便、更快捷的服务！",
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [
          {
            text: '确定',
            role: 'cancel'
          }
        ]
      }).then(p => p.present());
    // }
    // else {
    //   this.alertController.create({
    //     header: '系统升级提示',
    //     message: "当前系统已迁移至微信小程序，请在微信中搜索小程序:丰树地磅",
    //     backdropDismiss: false,
    //     keyboardClose: false,
    //     buttons: [
    //       {
    //         text: '确定',
    //         role: 'cancel'
    //       }
    //     ]
    //   }).then(p => p.present());
    // }
  }

  loadDefaultValue() {
    this.loadingCtrl.create({
      message: "请稍后",
    })
      .then((lc) => {
        lc.present();
        this.weightBillService.getWeightBillDefaultValue(this.data.WxOpenId, "").subscribe(result => {
          //存在历史记录
          if (result != null) {
            this.data.VehicleNo = result.VehicleNo;
            this.data.TareWeight = result.TareWeight;
          }
          //不存在历史记录
          else {
            this.data.VehicleNo = null;
            this.data.TareWeight = null;
            this.autoShowInparkHistory = true;//将自动显示入场记录的标识置为true
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
          header: '不存在历史记录',
          message: "请尝试输入车牌号码或者选择车辆入场记录",
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
  showHistoryCorporateAccount() {
    this.weightBillService.getHistoryCorporateAccount(this.data.WxOpenId).subscribe(corporateAccountList => {
      if (corporateAccountList.length == 0) {
        this.alertController.create({
          header: '不存在历史记录',
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
        corporateAccountList.forEach(element => {
          vehicleNoButtons.push({
            text: element,
            handler: () => {
              this.setCorporateAccount(element);
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
          header: "企业账号历史记录",
          subHeader: "请选择",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: vehicleNoButtons
        }).then(p => p.present());
      }
    });
  }
  showInParkVehicleNo(showNotExistsMessage: boolean) {
    this.weightBillService.getInParkVehicleNo().subscribe(vehicleNoList => {
      //不存在入场记录
      if (vehicleNoList.length == 0) {
        //如果需要弹出不存在入场记录的提示（手动点击的才弹出，自动显示的不弹出）
        if (showNotExistsMessage) {
          this.alertController.create({
            header: '不存在入场记录',
            message: "请尝试输入车牌号码或者选择历史记录",
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
      //存在入场记录，弹出让用户选择
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
          text: "没有我的车牌",
          role: "cancel",
          handler: () => {
            this.autoShowInparkHistory = false;
            this.vehicleNoInput.setFocus();
          }
        });
        this.actionSheetController.create({
          header: "园区车辆入场记录",
          subHeader: "请选择",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: vehicleNoButtons
        }).then(p => p.present());
      }
    });
  }
  ionViewDidEnter() {
    if (this.isMiniProgram == false)
      return;
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
          let amount=parseInt(obj.InvokeMethodName);
          //需要收费,跳转到支付页面
          if (amount> 0) {
            this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
              this.loadingCtrl.dismiss();
              this.gotoPay(parseInt(obj.InvokeClassName));
            });
          }
          //不需要收费，跳转到磅单页面
          else {
            this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
              this.loadingCtrl.dismiss();
              this.alertController.create({
                header: '称重已完成',
                subHeader: "点击确定后,系统将显示电子磅单",
                message: "如果您需要纸质磅单，请到门卫室领取",
                backdropDismiss: false,
                keyboardClose: false,
                buttons: [
                  {
                    text: '确定',
                    handler: () => {
                      this.detail(parseInt(obj.InvokeClassName));
                    }
                  }
                ]
              }).then(p => p.present());
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
        //二次过磅模式没有找到第一次过磅记录
        else if (obj.MsgContent == "Error1") {
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
          this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
            this.loadingCtrl.dismiss();
            this.alertController.create({
              header: '测量失败',
              subHeader: "未找到第一次过磅记录",
              message: "请核实车牌号码是否正确",
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
        //二次过磅模式两次重量一致
        else if (obj.MsgContent == "Error2") {

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
          this.signalRConnection.invoke("SendMessage2", sendData).then((data: boolean) => {
            this.loadingCtrl.dismiss();
            this.alertController.create({
              header: '测量失败',
              subHeader: "重量不正确",
              message: "第一次过磅重量和第二次过磅重量相同",
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
      if (this.data.WeighingMode == 0 && (this.data.TareWeight == null || this.data.TareWeight == undefined || this.data.TareWeight == 0)) {
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
      else if (this.data.WeighingMode == 3 && (this.data.IsReturn == null || this.data.IsReturn == undefined)) {
        this.alertController.create({
          header: '信息不完整',
          message: "二次过磅模式必须选择是第几次过磅",
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
        if (this.data.WeighingMode == 1)
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
    if (this.data.VehicleNo != null && this.data.VehicleNo != undefined && this.data.VehicleNo.length > 0) {
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
    else {
      if (this.autoShowInparkHistory == true) {
        this.showInParkVehicleNo(false);
      }
    }
  }
  vehicleNoFocus(event) {
    console.log(this.data.VehicleNo);
    if (this.autoShowInparkHistory == true) {
      if (this.data.VehicleNo == null || this.data.VehicleNo == undefined || this.data.VehicleNo.length == 0) {
        this.showInParkVehicleNo(false);
      }
    }
    //alert(this.data.VehicleNo);
  }
  setVehicleNo(val: string) {
    this.weightBillForm1.controls["vehicleNo"].setValue(val);
  }
  setCorporateAccount(val: string) {
    this.weightBillForm1.controls["corporateAccount"].setValue(val);
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
