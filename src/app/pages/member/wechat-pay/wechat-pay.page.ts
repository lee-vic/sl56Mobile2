import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController, LoadingController,ActionSheetController,NavController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { WechatPayService } from 'src/app/providers/wechat-pay.service';
import { SignalRConnection, SignalR } from 'ng2-signalr';
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
  openId: any;
  cid:any;
  allSelected: boolean = true;
  amountInputDisable: boolean = false;
  signalRConnection: SignalRConnection;
  selectedProductType:any=0;
  productTypes:any;
  otherCurrencyAmounts:any;
  constructor(public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private signalR: SignalR,
    private cookieService: CookieService,
    public service: WechatPayService,
    private router: Router,
    private route: ActivatedRoute,
    private userService:UserService,
    private actionSheetCtrl:ActionSheetController,
    private navCtrl:NavController) {
      this.openId =this.route.snapshot.paramMap.get('id');
      this.cid =this.route.snapshot.queryParams['cid'];
  }

  ngOnInit(): void {
    this.loadingCtrl.create({
      message: '请稍后...'
    }).then(p => {
      p.present()
      this.service.getList(this.openId,this.cid).subscribe(res => {
        this.data = res;
        this.data.ProductType=this.selectedProductType;
        if (this.data.ReceiveGoodsDetailList.length > 0) {
          this.amountInputDisable = true;
        }
        else {
          this.amountInputDisable = false;
        }
        this.loadingCtrl.dismiss();
        this.signalRConnection = this.signalR.createConnection();
        this.signalRConnection.status.subscribe((p) => console.warn(p.name));
        this.signalRConnection.start().then((c) => {
          let listener = c.listenFor("messageReceived");
          listener.subscribe((msg: any) => {
            let obj = JSON.parse(msg);
            if (obj.MsgContent == "True") {
              this.payHistory();
              // this.navCtrl.push(UserWechatPayListPage);
            }
            else {
              this.toastCtrl.create({
                message: "支付失败",
                position: 'middle',
                duration: 1500
              }).then(p => p.present());
    
            }
          });
        });
        this.userService.getHomeInfo().subscribe(res=>{
          this.otherCurrencyAmounts = res.CurrencyAmount.filter(p=>p.Id!=this.cid);
          console.log(this.otherCurrencyAmounts);
        })

      }, (error) => {
        this.loadingCtrl.dismiss();
        this.toastCtrl.create({
          message: error.statusText,
          position: 'middle',
          duration: 1500
        }).then(p => p.present());
      });

    });

   this.service.getProductTypes().subscribe(res=>{
    this.productTypes=res;
    console.log(res);
   });



  }
  ngOnDestroy(): void {
    this.signalRConnection.stop();
  }


  onAllClick() {
    if (this.data != undefined && this.data.ReceiveGoodsDetailList != undefined) {
      this.data.ReceiveGoodsDetailList.forEach(element => {
        element.Selected = this.allSelected;
      });
    }

  }
  selectChange() {
    let selectedAmount: number = 0;
    let selectedList = new Array();
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
    console.log("ngmodel");
    this.calculateAmount();

  }
  calculateAmount() {
    let tempAmount: number = 0;
    if (this.data.OriginalAmount != "" && this.data.OriginalAmount != null)
      tempAmount = parseFloat(this.data.OriginalAmount)*this.data.OriginalCurrencyRate;
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
        this.payByH5();
        // this.alertCtrl.create({
        //   header: '提示',
        //   subHeader: "暂不支持此支付方式",
        //   message: "请使用我司公众号、小程序、PC版本网站进行支付",
        //   buttons: [{
        //     text: "确定",
        //   }]
        // }).then(p => p.present());
      }
    }
  }
  payByJsApi() {
    this.data.TradeType = "JSAPI";
    this.loadingCtrl.create({
      message: '请稍后...'
    }).then(p => {
      p.present();
      this.service.pay(this.data).subscribe(res => {

        this.loadingCtrl.dismiss();
        if (res.Success) {
          let jsApiParam = JSON.parse(res.Data);
          this.callpay(jsApiParam);
        }
        else {
          this.toastCtrl.create({
            message: res.ErrMsg,
            position: 'middle',
            duration: 3000
          }).then(p => p.present());
        }

      }, (err) => {
        this.loadingCtrl.dismiss();
        this.toastCtrl.create({
          message: err.message,
          position: 'middle',
          duration: 3000
        }).then(p => p.present());
      });
    });


  }
  payByH5() {
    this.data.TradeType = "MWEB";
    this.loadingCtrl.create({
      message: '请稍后...'
    }).then(p => p.present());
    this.service.pay(this.data).subscribe(res => {
      console.log(res);
      this.loadingCtrl.dismiss();
      if (res.Success)
        location.href = res.PayUrl;
      else {
        this.toastCtrl.create({
          message: res.ErrMsg,
          position: 'middle',
          duration: 3000
        }).then(p => p.present());
      }
    }, (err) => {
      this.loadingCtrl.dismiss();
      this.toastCtrl.create({
        message: err.message,
        position: 'middle',
        duration: 3000
      }).then(p => p.present());


    });
  }


  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);

    if (m != null && m.toString() == "micromessenger") {
      return true;
    }
    return false;
  }

  listClick() {
    // this.navCtrl.push(UserWechatPayListPage);
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
        if (res.err_msg == "get_brand_wcpay_request:ok") {
          this.toastCtrl.create({
            message: "支付成功",
            position: 'middle',
            duration: 1000
          }).then(p => p.present());

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
    console.log("selectedType:",this.selectedProductType);
  }
  async presentActionSheet() {
    let buttons = new Array();
    this.otherCurrencyAmounts.forEach(p=>{
      buttons.push({
        text: p.Name+"："+p.Amount,
        handler: (e) => {
          //id+1用来改变路由地址，以触发页面跳转刷新
          this.navCtrl.navigateForward("/member/wechat-pay/"+(p.Id+1)+"?cid="+p.Id,{replaceUrl:true});
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
}
