import { Component, OnInit, OnDestroy } from '@angular/core';
import { AlertController, ActionSheetController, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { WechatPayService } from 'src/app/providers/wechat-pay.service';
import { SignalRConnection, SignalR } from 'src/app/providers/signal-r.service';
import { UserService } from 'src/app/providers/user.service';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

declare const WeixinJSBridge: {
  invoke: (method: string, params: Record<string, unknown>, callback: (res: { err_msg?: string }) => void) => void;
};

interface WechatPayReceiveGoodsItem {
  Id: number;
  Amount: string;
  Selected: boolean;
}

interface WechatPayData {
  ReceiveGoodsDetailList: WechatPayReceiveGoodsItem[];
  Amount: string | number;
  Amount1: number;
  TotalAmount: string | number;
  WXPaymentCommission: boolean;
  WXPaymentCommissionRate: number;
  Commission: string | number;
  SelectIdList?: string;
  IsRelease?: boolean;
  ProductType?: number;
  CurrencyName?: string;
  CustomerName?: string;
  PayMessage?: string;
  TradeType?: string;
}

interface ProductTypeOption {
  Key: number;
  Value: string;
}

interface CurrencyAmountItem {
  Id: number;
  Name: string;
  Amount: number | string;
}
@Component({
  selector: 'app-wechat-pay',
  templateUrl: './wechat-pay.page.html',
  styleUrls: ['./wechat-pay.page.scss'],
})
export class WechatPayPage implements OnInit, OnDestroy {
  data: WechatPayData = {
    ReceiveGoodsDetailList: [],
    Amount: 0,
    Amount1: 0,
    TotalAmount: 0,
    WXPaymentCommission: false,
    WXPaymentCommissionRate: 0,
    Commission: 0,
  };
  openId: string = '';
  cid: number;
  allSelected: boolean = true;
  amountInputDisable: boolean = false;
  isLoading: boolean = true;

  get canPay(): boolean {
    const total = Number(this.data?.TotalAmount);
    return Number.isFinite(total) && total >= 0.01;
  }

  get selectedCount(): number {
    return this.data?.ReceiveGoodsDetailList?.filter((i: WechatPayReceiveGoodsItem) => i.Selected)?.length ?? 0;
  }

  get selectedTotal(): number {
    return this.data?.ReceiveGoodsDetailList?.filter((i: WechatPayReceiveGoodsItem) => i.Selected)
      ?.reduce((sum: number, i: WechatPayReceiveGoodsItem) => sum + parseFloat(i.Amount || '0'), 0) ?? 0;
  }

  signalRConnection?: SignalRConnection;
  private signalStatusSub?: Subscription;
  private signalMessageSub?: Subscription;
  private readonly destroy$ = new Subject<void>();
  selectedProductType = 0;
  productTypes: ProductTypeOption[] = [];
  otherCurrencyAmounts: CurrencyAmountItem[] = [];
  constructor(public alertCtrl: AlertController,
    private signalR: SignalR,
    public service: WechatPayService,
    private router: Router,
    private route: ActivatedRoute,
    private userService:UserService,
    private actionSheetCtrl:ActionSheetController,
    private toastCtrl: ToastController,
    private readonly uiFeedback: UiFeedbackService) {
      this.openId = this.route.snapshot.paramMap.get('id') || '';
      if(this.route.snapshot.queryParams['cid']==null){
        this.cid=1;
      }else{
        this.cid = Number(this.route.snapshot.queryParams['cid']) || 1;
      }
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getList(this.openId,this.cid).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
      //支付外币时，不选择单号（若勾选单号，则支付金额会变成选择单号的总金额）
      if(this.cid !== 1){
        res.ReceiveGoodsDetailList.forEach((p: WechatPayReceiveGoodsItem) => {
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
      this.isLoading = false;
        this.signalRConnection = this.signalR.createConnection();
        this.signalStatusSub = this.signalRConnection.status.subscribe();
        this.signalRConnection.start().then((c) => {
          let listener = c.listenFor("messageReceived");
          this.signalMessageSub = listener.subscribe((msg: unknown) => {
            let obj: { MsgContent?: string } | null = null;
            try {
              obj = typeof msg === 'string' ? JSON.parse(msg) : (msg as { MsgContent?: string });
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
        this.userService.getHomeInfo().pipe(takeUntil(this.destroy$)).subscribe(res=>{
          const amounts = Array.isArray(res?.CurrencyAmount) ? res.CurrencyAmount : [];
          this.otherCurrencyAmounts = amounts.filter((p: CurrencyAmountItem) => p.Id != this.cid);
        })

        },
        error: (error) => {
          this.isLoading = false;
          this.presentToast(error.statusText, 1500);
        }
      });

  this.service.getProductTypes().pipe(takeUntil(this.destroy$)).subscribe(res=>{
    this.productTypes = Array.isArray(res) ? res : [];
   this.setDefaultProductType();
  });



  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.signalStatusSub) {
      this.signalStatusSub.unsubscribe();
    }
    if (this.signalMessageSub) {
      this.signalMessageSub.unsubscribe();
    }
    if (this.signalRConnection) {
      this.signalRConnection.stop();
    }
  }


  onAllClick() {
    if (this.data !== undefined && this.data.ReceiveGoodsDetailList !== undefined) {
      this.data.ReceiveGoodsDetailList.forEach((element: WechatPayReceiveGoodsItem) => {
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
    this.data.ReceiveGoodsDetailList.filter((item: WechatPayReceiveGoodsItem) => {
      return item.Selected;
    }).forEach((item: WechatPayReceiveGoodsItem) => {

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
      tempAmount = parseFloat(String(this.data.Amount));
    if (this.data.WXPaymentCommission) {
      this.data.Commission = (tempAmount * this.data.WXPaymentCommissionRate).toFixed(2);
    }
    else {
      this.data.Commission = 0;
    }
    this.data.Amount=tempAmount;
    this.data.TotalAmount = (tempAmount + parseFloat(String(this.data.Commission))).toFixed(2);
  }
  payClick() {
    if (!this.canPay) {
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
    this.uiFeedback.presentLoading('正在支付...').then(loading => {
      this.service.pay(this.data).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.uiFeedback.dismissLoading(loading);
        })
      ).subscribe({
      next: (res) => {
        if (res.Success) {
          let jsApiParam: Record<string, unknown> | null = null;
          try {
            jsApiParam = JSON.parse(res.Data);
          } catch {
            this.presentToast('支付参数解析失败，请稍后重试', 3000);
            return;
          }
          if (!jsApiParam) {
            this.presentToast('支付参数缺失，请稍后重试', 3000);
            return;
          }
          this.callpay(jsApiParam);
        }
        else {
          this.presentToast(res.ErrMsg, 3000);
        }
      },
      error: (err) => {
        this.presentToast(err.message, 3000);
      }
      });
    });
  }
  payByH5() {
    this.data.TradeType = "MWEB";
    this.uiFeedback.presentLoading('正在支付...').then(loading => {
      this.service.pay(this.data).pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.uiFeedback.dismissLoading(loading);
        })
      ).subscribe({
        next: (res) => {
          if (res.Success)
            location.href = res.PayUrl;
          else {
            this.presentToast(res.ErrMsg, 3000);
          }
        },
        error: (err) => {
          this.presentToast(err.message, 3000);
        }
      });
    });
  }


  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);

    if (m != null && m.toString() === "micromessenger") {
      return true;
    }
    return false;
  }

  callpay(jsApiParam: Record<string, unknown>) {
    if (typeof WeixinJSBridge == "undefined") {
      if (document.addEventListener) {
        document.addEventListener('WeixinJSBridgeReady', () => this.jsApiCall(jsApiParam), false);
      }
    }
    else {
      this.jsApiCall(jsApiParam);
    }
  }
  jsApiCall(jsApiParam: Record<string, unknown>) {
    WeixinJSBridge.invoke(
      'getBrandWCPayRequest',
      jsApiParam,//josn串
      (res: { err_msg?: string }) => {
        if (res.err_msg === "get_brand_wcpay_request:ok") {
          this.presentToast("支付成功", 1000);

        }
        else {
          this.presentAlert("支付未完成", "您可在支付记录中查看订单状态，或稍后重试。");
        }
      });
  }
  //val 0:历史欠款模式 1:无历史欠款模式
  showDesc(_val: number) {
    this.router.navigateByUrl("/member/wechat-pay-description");
  }

  payHistory() {
    this.router.navigateByUrl("/member/wechat-pay-list");
  }
  typeChange(e: CustomEvent){
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
        handler: () => {
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
    this.toastCtrl.create({ message, duration, position: 'middle' }).then(p => p.present());
  }

  private presentAlert(subHeader: string, message: string): void {
    this.alertCtrl.create({
      header: '提示',
      subHeader,
      message,
      buttons: [{ text: '确定' }],
    }).then(p => p.present());
  }
}
