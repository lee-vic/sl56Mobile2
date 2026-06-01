import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController, LoadingController,ActionSheetController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { WechatPayService } from 'src/app/providers/wechat-pay.service';
import { SignalRConnection, SignalR } from 'src/app/providers/signal-r.service';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from 'src/app/providers/user.service';

declare var WeixinJSBridge: any;
@Component({
  selector: 'app-wechat-pay',
  templateUrl: './wechat-pay.page.html',
  styleUrls: ['./wechat-pay.page.scss'],
})
export class WechatPayPage implements OnInit, OnDestroy {
  data: any = {};
  openId: string;
  cid: number;
  allSelected: boolean = true;
  amountInputDisable: boolean = false;
  signalRConnection?: SignalRConnection;
  selectedProductType: any = 0;
  productTypes: any[] = [];
  otherCurrencyAmounts: any[] = [];
  constructor(public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private signalR: SignalR,
    private cookieService: CookieService,
    public service: WechatPayService,
    private router: Router,
    private route: ActivatedRoute,
    private userService:UserService,
    private actionSheetCtrl:ActionSheetController) {
      this.openId =this.route.snapshot.paramMap.get('id');
      if(this.route.snapshot.queryParams['cid']==null){
        this.cid=1;
      }else{
        this.cid = Number(this.route.snapshot.queryParams['cid']) || 1;
      }
  }

  ngOnInit(): void {
    this.presentLoading('请稍后...').then(loader => {
      this.service.getList(this.openId,this.cid).subscribe({
        next: (res) => {
        //支付外币时，不选择单号（若勾选单号，则支付金额会变成选择单号的总金额）
        if(this.cid !== 1){
          res.ReceiveGoodsDetailList.forEach(p=>{
            p.Selected=false;
          });
          this.allSelected=false;
        }
        this.data = res;
        this.data.ProductType=this.selectedProductType;
        if (this.data.ReceiveGoodsDetailList.length > 0 && this.cid === 1) {
          this.amountInputDisable = true;
        }
        else {
          this.amountInputDisable = false;
        }
        loader.dismiss();
        this.signalRConnection = this.signalR.createConnection();
        this.signalRConnection.status.subscribe();
        this.signalRConnection.start().then((c) => {
          let listener = c.listenFor("messageReceived");
          listener.subscribe((msg: any) => {
            let obj: any = null;
            try {
              obj = typeof msg === 'string' ? JSON.parse(msg) : msg;
            } catch (e) {
              return;
            }
            if (!obj || typeof obj !== 'object') return;
            if (obj.MsgContent === "True") {
              this.payHistory();
            }
            else {
              this.presentToast("支付失败", 1500);
    
            }
          });
        });
        this.userService.getHomeInfo().subscribe(res=>{
          this.otherCurrencyAmounts = res.CurrencyAmount.filter(p=>p.Id!=this.cid);
        })

        },
        error: (error) => {
          loader.dismiss();
          this.presentToast(error.statusText, 1500);
        }
      });

    });

  this.service.getProductTypes().subscribe(res=>{
    this.productTypes = Array.isArray(res) ? res : [];
   this.setDefaultProductType();
  });



  }
  ngOnDestroy(): void {
    if (this.signalRConnection) {
      this.signalRConnection.stop();
    }
  }


  onAllClick() {
    if (this.data !== undefined && this.data.ReceiveGoodsDetailList !== undefined) {
      this.data.ReceiveGoodsDetailList.forEach(element => {
        element.Selected = this.allSelected;
      });
      // Ionic 8 does not always emit child checkbox change events for programmatic updates.
      this.selectChange();
    }

  }
  setDefaultProductType() {
    if (!this.productTypes || this.productTypes.length === 0) {
      return;
    }
    let defaultItem = this.productTypes[0];
    for (const item of this.productTypes) {
      if (item && item.Value === '国际快递') {
        defaultItem = item;
        break;
      }
    }
    this.selectedProductType = defaultItem.Key;
    this.data.ProductType = this.selectedProductType;
  }
  selectChange() {
    let selectedAmount: number = 0;
    let selectedList: number[] = [];
    this.data.ReceiveGoodsDetailList.filter(item => {
      return item.Selected;
    }).forEach(item => {

      selectedAmount = selectedAmount + parseFloat(item.Amount)
      selectedList.push(item.Id);
    });

    this.data.Amount = (selectedAmount + this.data.Amount1).toFixed(2);
    this.data.SelectIdList = selectedList.toString();
    if (selectedList.length > 0) {
      this.amountInputDisable = true;
      this.data.IsRelease = false;
    }
    else {
      this.amountInputDisable = false;
      this.data.IsRelease = true;
    }
    this.calculateAmount();
  }
  amountChange() {
    this.calculateAmount();

  }
  calculateAmount() {
    let tempAmount: number = 0;
    if (this.data.Amount !== "" && this.data.Amount != null)
      tempAmount = parseFloat(this.data.Amount);
    if (this.data.WXPaymentCommission) {
      this.data.Commission = (tempAmount * this.data.WXPaymentCommissionRate).toFixed(2);
    }
    else {
      this.data.Commission = 0;
    }
    this.data.Amount=tempAmount;
    this.data.TotalAmount = (tempAmount + parseFloat(this.data.Commission)).toFixed(2);
  }
  payClick() {
    if (this.data.TotalAmount < 0.01) {
      this.alertCtrl.create({
        header: '提示',
        subHeader: "金额错误",
        message: "支付金额必须大于等于0.01元",
        buttons: [{
          text: "确定",
        }]
      }).then(p => p.present());
    }
    else {
      //微信浏览器
      if (this.IsMicroMessenger()) {
        this.payByJsApi();
      }
      else {
        // this.payByH5();
        this.presentAlert("暂不支持此支付方式", "请使用我司公众号、小程序、PC版本网站进行支付");
      }
    }
  }
  payByJsApi() {
    this.data.TradeType = "JSAPI";
    this.presentLoading('请稍后...').then(loader => {
      this.service.pay(this.data).subscribe({
        next: (res) => {

        loader.dismiss();
        if (res.Success) {
          let jsApiParam = JSON.parse(res.Data);
          this.callpay(jsApiParam);
        }
        else {
          this.presentToast(res.ErrMsg, 3000);
        }

        },
        error: (err) => {
          loader.dismiss();
          this.presentToast(err.message, 3000);
        }
      });
    });


  }
  payByH5() {
    this.data.TradeType = "MWEB";
    this.presentLoading('请稍后...').then(loader => this.service.pay(this.data).subscribe({
      next: (res) => {
        loader.dismiss();
        if (res.Success)
          location.href = res.PayUrl;
        else {
          this.presentToast(res.ErrMsg, 3000);
        }
      },
      error: (err) => {
        loader.dismiss();
        this.presentToast(err.message, 3000);


      }
    }));
  }


  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);

    if (m != null && m.toString() === "micromessenger") {
      return true;
    }
    return false;
  }

  callpay(jsApiParam) {
    if (typeof WeixinJSBridge == "undefined") {
      if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', this.jsApiCall, false);
      }
    }
    else {
      this.jsApiCall(jsApiParam);
    }
  }
  jsApiCall(jsApiParam) {
    WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      jsApiParam,//josn串
      (res) => {
        if (res.err_msg === "get_brand_wcpay_request:ok") {
          this.presentToast("支付成功", 1000);

        }
        else {
          alert(res.err_code + res.err_desc + res.err_msg);
        }
      });
  }
  //val 0:历史欠款模式 1:无历史欠款模式
  showDesc(val) {
    this.router.navigateByUrl("/member/wechat-pay-description");
  }

  payHistory() {
    this.router.navigateByUrl("/member/wechat-pay-list");
  }
  typeChange(e){
    this.selectedProductType=e.detail.value;
    this.data.ProductType=this.selectedProductType;
  }
  async presentActionSheet() {
    if (!this.otherCurrencyAmounts || this.otherCurrencyAmounts.length === 0) {
      return;
    }
    let buttons = new Array();
    this.otherCurrencyAmounts.forEach(p=>{
      buttons.push({
        text: p.Name+"："+p.Amount,
        handler: (e) => {
          //id+1用来改变路由地址，以触发页面跳转刷新
          this.router.navigateByUrl("/member/wechat-pay/"+(p.Id+1)+"?cid="+p.Id, { replaceUrl: true });
        }
      });
    });
    buttons.push({
      text: '取消',
      icon: 'close',
      role: 'cancel',
      handler: () => {
      }
    });
    const actionSheet = await this.actionSheetCtrl.create({
      header: '请选择支付的币种',
      buttons: buttons
    });
    await actionSheet.present();
  }

  private presentToast(message: string, duration = 1500): void {
    this.toastCtrl.create({
      message,
      position: 'middle',
      duration,
    }).then(p => p.present());
  }

  private presentAlert(subHeader: string, message: string): void {
    this.alertCtrl.create({
      header: '提示',
      subHeader,
      message,
      buttons: [{ text: '确定' }],
    }).then(p => p.present());
  }

  private async presentLoading(message: string) {
    const loader = await this.loadingCtrl.create({ message });
    await loader.present();
    return loader;
  }
}
