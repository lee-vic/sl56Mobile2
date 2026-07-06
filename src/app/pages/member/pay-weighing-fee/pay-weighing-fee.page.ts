import { NavController, AlertController, ToastController, ActionSheetController, IonInput, LoadingController } from '@ionic/angular';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CookieService } from "ngx-cookie-service";
import { WeightBill } from 'src/app/interfaces/weight-bill';
import { WeightBillService } from 'src/app/providers/weight-bill.service';
import { SignalR, SignalRConnection } from 'src/app/providers/signal-r.service';
import { Subscription } from 'rxjs';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

@Component({
  selector: "app-pay-weighing-fee",
  templateUrl: "./pay-weighing-fee.page.html",
  styleUrls: ["./pay-weighing-fee.page.scss"],
})
export class PayWeighingFeePage implements OnInit, OnDestroy {
  private readonly readWeightTimeoutMs = 20 * 1000;
  private readWeightTimeoutHandle: any;
  private readWeightTimedOut = false;
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
      { type: "required", message: "请输入车牌号码" },
      { type: "maxlength", message: "车牌号码最多 8 位" }
    ],
    "tareWeight": [
      { type: "required", message: "请输入皮重（车重）" },
      { type: "min", message: "皮重（车重）需大于 1KG" }
    ],
    "pricePerTon": [
      { type: "required", message: "请选择过磅费方式" }
    ],
    "corporateAccount": [
      { type: "maxLength", message: "企业账号最多 32 位" }
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
      isReturn: [null],
      equipmentNumber:[null]
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
      this.initSignalRConnection();
      this.alertController.create({
        header: '过磅小程序已升级',
        message: "您可以在微信下拉列表中快速打开“丰树地磅”，无需下车扫码即可办理过磅。",
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
    //     header: '过磅小程序已升级',
    //     message: "请在微信中搜索“丰树地磅”小程序办理过磅。",
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
      message: '正在读取车辆信息...',
    }).then(lc => {
      lc.present();
      this.weightBillService.getWeightBillDefaultValue(this.data.WxOpenId, "").subscribe({
        next: (result) => {
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
        },
        error: (_error) => {
          lc.dismiss();
        }
      });
    });
  }

  showHistoryVehicleNo() {
    this.weightBillService.getHistoryVehicleNo(this.data.WxOpenId).subscribe(vehicleNoList => {
      if (vehicleNoList.length == 0) {
        this.alertController.create({
          header: '暂无历史车牌',
          message: "请手动输入车牌号码，或选择当前园区入场记录。",
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
          subHeader: "请选择要使用的车牌号码",
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
          header: '暂无企业账号记录',
          message: "当前微信账号还没有可复用的企业账号，请按需手动填写。",
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
          subHeader: "请选择要使用的企业账号",
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
            header: '暂无入场记录',
            message: "未查询到当前园区入场车辆，请手动输入车牌号码，或从历史记录中选择。",
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
          subHeader: "请选择当前入场车辆",
          backdropDismiss: false,
          keyboardClose: false,
          buttons: vehicleNoButtons
        }).then(p => p.present());
      }
    });
  }
  private initSignalRConnection() {
    if (this.isMiniProgram == false)
      return;
    this.signalRConnection.start().then((c) => {
      this.signalRConnected = true;
      //监听读数服务读数已完毕的事件
      let listener = c.listenFor("messageReceived");

      if (this.subscriber != undefined)
        this.subscriber.unsubscribe();
      this.subscriber = listener.subscribe((msg: any) => {
        if (this.readWeightTimedOut) {
          return;
        }
        this.finishReadWeightWaiting();
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
          let amount=parseFloat(obj.InvokeMethodName);
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
                subHeader: "电子磅单已生成",
                message: "点击确定后查看本次过磅结果。",
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
        else if (this.isReadFailureMessage(obj.MsgContent)) {
          const failureMessage = this.getReadFailureMessage(obj.MsgContent);
          this.loadingCtrl.dismiss();
          this.alertController.create({
            header: '称重没有完成',
            subHeader: failureMessage.subHeader,
            message: failureMessage.message,
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
              header: '找不到第一次过磅记录',
              subHeader: "无法完成二次过磅",
              message: "请确认车牌号码是否正确，或先完成第一次过磅。",
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
              header: '两次重量没有变化',
              subHeader: "两次重量相同",
              message: "本次重量和第一次过磅相同。请确认车辆已装卸完成后，再重新称重。",
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
  detail(objectId) {
    const options = {
      queryParams: {
        ObjectId: objectId,
        OpenId: this.data.WxOpenId,
        IsAskPrint:true
      },
    };
    this.navController.navigateForward(
      "/member/pay-weighing-fee/result/" + objectId,options
    );
  }
  gotoPay(objectId) {
    const options = {
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
          header: '还缺少皮重',
          message: "称净重需要先填写皮重（车重）。请补充后再开始称重。",
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
          header: '请选择过磅次数',
          message: "二次过磅前，请先选择这是第一次过磅还是第二次过磅。",
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
        header: '信息还没填完整',
        message: "请按页面提示补全必填内容，再开始称重。",
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
        this.weightBillService.getWeightBillDefaultValue(this.data.WxOpenId, this.data.VehicleNo).subscribe({
          next: (result) => {
            if (result != null) {
              this.data.TareWeight = result.TareWeight;
            }
            else {
              this.data.TareWeight = null;
            }

          },
          error: (_error) => {

          }
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

  private isReadFailureMessage(message: string) {
    return [
      "Timeout",
      "TimeoutNoReading",
      "TimeoutUnstable",
      "DeviceDisconnected",
      "InvalidWeightData",
      "WeightSaveFailed"
    ].indexOf(message) >= 0;
  }

  private getReadFailureMessage(message: string) {
    switch (message) {
      case "TimeoutNoReading":
        return {
          subHeader: "没有收到设备读数",
          message: "读数设备暂时没有返回数据，可能是设备未连接、读数程序异常或设备未发送数据。请重新开始称重；仍不成功请联系园区门口保安室工作人员。"
        };
      case "TimeoutUnstable":
      case "Timeout":
        return {
          subHeader: "没有读到稳定重量",
          message: "重量一直在变化，暂时无法完成称重。请确认车辆已停稳后重新开始称重；仍不成功请联系园区门口保安室工作人员。"
        };
      case "DeviceDisconnected":
        return {
          subHeader: "称重设备未连接",
          message: "当前无法连接称重设备，可能是设备未开机、连接中断或读数程序未运行。请重新开始称重；仍不成功请联系园区门口保安室工作人员。"
        };
      case "InvalidWeightData":
        return {
          subHeader: "设备读数异常",
          message: "设备返回的读数异常，可能是数据格式错误、设备干扰或读数程序异常。请重新开始称重；仍不成功请联系园区门口保安室工作人员。"
        };
      case "WeightSaveFailed":
        return {
          subHeader: "重量保存失败",
          message: "设备已读到重量，但系统保存失败。请稍后重新开始称重；仍不成功请联系园区门口保安室工作人员。"
        };
      default:
        return {
          subHeader: "称重暂时失败",
          message: "本次称重没有完成，请重新开始称重。"
        };
    }
  }

  private startReadWeightTimeout() {
    this.clearReadWeightTimeout();
    this.readWeightTimedOut = false;
    this.readWeightTimeoutHandle = setTimeout(() => {
      this.readWeightTimeoutHandle = null;
      this.readWeightTimedOut = true;
      this.loadingCtrl.dismiss();
      this.stopReadWeightDevice();
      this.alertController.create({
        header: '称重没有响应',
        subHeader: "一直没有收到设备返回结果",
        message: "请确认设备在线、网络正常后重新开始称重；仍不成功请联系园区门口保安室工作人员。",
        backdropDismiss: false,
        keyboardClose: false,
        buttons: [
          {
            text: '确定',
            role: 'cancel'
          }
        ]
      }).then(p => p.present());
    }, this.readWeightTimeoutMs);
  }

  private finishReadWeightWaiting() {
    this.clearReadWeightTimeout();
    this.readWeightTimedOut = false;
  }

  private clearReadWeightTimeout() {
    if (this.readWeightTimeoutHandle) {
      clearTimeout(this.readWeightTimeoutHandle);
      this.readWeightTimeoutHandle = null;
    }
  }

  private stopReadWeightDevice() {
    if (!this.signalRConnection) {
      return;
    }
    this.signalRConnection.invoke("SendMessage2", {
      MsgFrom: 16075,
      FromClientType: 1,
      MsgFromType: 0,
      MsgTo: 1,
      ToClientType: 13,
      MsgToType: 1,
      MsgContent: "Stop",
      InvokeClassName: this.data.WxOpenId,
      InvokeMethodName: ""
    });
  }


  startRead() {
    this.loadingCtrl.create({
      message: '正在连接称重设备...'
    }).then(p => p.present());
    //通知读数端开始读数
    this.weightBillService.start(this.data)
      .subscribe({
        next: (started) => {
          this.loadingCtrl.dismiss();
          console.log(typeof (started));
          console.log(started);
          if (started == true) {
            this.loadingCtrl.create({
              message: '正在读取重量，请保持车辆停稳...'
            }).then(p => {
              p.present();
              this.startReadWeightTimeout();
            });

          }
          else {
            this.alertController.create({
              header: '称重设备没有启动',
              subHeader: "暂时无法连接设备",
              message: "请稍后重新开始称重；仍不成功请联系园区门口保安室工作人员。",
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
        },
        error: (err) => {
          this.loadingCtrl.dismiss();
          console.log(err);
          this.alertController.create({
            header: '设备响应超时',
            subHeader: "暂时没有收到设备回复",
            message: "请检查网络、设备连接和读数程序后重新开始称重；仍不成功请联系园区门口保安室工作人员。",
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
  }

  ngOnDestroy(): void {
    this.clearReadWeightTimeout();
    if (this.signalRConnection) {
      this.signalRConnection.stop();
    }
  }
}
