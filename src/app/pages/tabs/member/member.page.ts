import { Component, OnInit } from '@angular/core';
import { Menu, MenuRow, Menus } from '../../../interfaces/menu';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Platform, ToastController, LoadingController,NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../../providers/user.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/app/interfaces/user';
import { JPush } from '@jiguang-ionic/jpush/ngx';

@Component({
  selector: 'app-member',
  templateUrl: './member.page.html',
  styleUrls: ['./member.page.scss'],
})
export class MemberPage implements OnInit {
  allMenus: Array<Menu> = [
    { title: "价格查询", image: "assets/imgs/member-2.png", type: [0, 1], url: "/member/calculation" },
    { title: "偏远查询", image: "assets/imgs/member-3.png", type: [0, 1], url: "/member/remote" },
    { title: "交货清单确认", image: "assets/imgs/member-5.png", type: [0,1], url: "/member/confirmation" },
    { title: "交货记录", image: "assets/imgs/member-6.png", type: [0, 1], url: "/member/delivery-record/list" },
    { title: "问题跟进", image: "assets/imgs/member-18.png", type: [0, 1], url: "/member/problem-list" },
    { title: "退货管理", image: "assets/imgs/member-20.png", type: [0, 1], url: "/member/return-list" },
    { title: "微信支付", image: "assets/imgs/member-8.png", type: [0, 1], url: "/member/wechat-pay/0?cid=1" },
    { title: "银行账号", image: "assets/imgs/member-23.png", type: [0, 1], url: "/member/bank" },
    { title: "消息订阅", image: "assets/imgs/member-22.png", type: [0, 1], url: "/member/message-subscription/list" },
    { title: "联系客服", image: "assets/imgs/member-6.png", type: [0,1], url: "/member/chat/0" },
    { title: "修改登录密码", image: "assets/imgs/member-11.png", type: [0], url: "/member/modify-password" },
    { title: "修改交货密码", image: "assets/imgs/member-11.png", type: [0], url: "/member/modify-deliverypassword" },
    { title: "子账号管理", image: "assets/imgs/member-12.png", type: [0], url: "/member/sub-account" },
    { title: "微信绑定", image: "assets/imgs/member-13.png", type: [0, 1], url: "/member/wechat-binding" },
    { title: "银行水单上传(优先放货)", image: "assets/imgs/member-17.png", type: [0, 1], url: "/member/bank-slips" },
    { title: "业务公告", image: "assets/imgs/member-19.png", type: [0,1], url: "/member/notice-list" },
    { title: "模板下载", image: "assets/imgs/member-7.png", type: [0, 1], url: "/member/template-list" },
    { title: "查看报价", image: "assets/imgs/member-10.png", type: [0], url: "/member/price-list" },
    { title: "合同签署", image: "assets/imgs/member-24.png", type: [0, 1], url: "/member/sign-the-contract" },
    { title: "香港入仓申请", image: "assets/imgs/member-26.png", type: [0, 1], url: "/member/warehouse-application" }
  ];
  menus: Menus;
  isLogin: boolean = false;
  public authForm: FormGroup;
  public loading: any;
  userInfo: User;
  username: string = "";
  customerType: number;
  currencyAmount: any;
  waitToSignTaskCount: number = 0;
  constructor(public toastCtrl: ToastController,
    public plt: Platform,
    private userService: UserService,
    private router: Router,
    private jpush: JPush,
    private cookieService: CookieService,
    public loadingCtrl: LoadingController,
    private navCtrl:NavController) {
    this.authForm = new FormGroup({
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      clientType: new FormControl(''),
      userType: new FormControl(0, Validators.required),
      rememberMe: new FormControl(true, Validators.required),
      isBind: new FormControl(true, Validators.required),
      openId: new FormControl(''),
      unionId: new FormControl(''),
    });
  }

  ngOnInit() {
    this.menus = new Menus();
    this.menus.rows = [];
    this.loadingCtrl.create({
      message: '请稍后...'
    }).then(p => {
      p.present();
      this.userService.isAuthenticated().subscribe(res => {
        this.loadingCtrl.dismiss();
        this.isLogin = true;
        this.loginSuccess();
      }, (err) => {
        this.loadingCtrl.dismiss();
        if (err.status == 401) {
          this.isLogin = false;
        }
      });
    });


  }
  forgetPasswordClick() {
    this.router.navigateByUrl("/member/reset-password");
  }
  ionViewDidEnter() {
    console.log("ionViewDidEnter");
  }
  doLogin(formValue) {


    this.showLoading("请稍后...");
    if (this.plt.is("mobileweb") || this.plt.is("desktop")) {
      formValue.clientType = 1;
      formValue.openId = this.cookieService.get('OpenId');
      formValue.unionId = this.cookieService.get('UnionId');
    }
    this.userService.auth(formValue).subscribe((res:any) => {
      this.isLogin =  res.Success;
      if (this.isLogin == true) {
        this.loginSuccess();
      }

      this.loading.dismiss();
      if (!this.isLogin) {
        this.showToast(res.ErrMsg);
      }
      // else {
      //   localStorage.setItem("username", formValue.username);
      // }

    }, (err) => {
      this.showToast(err.message);
    });

  }
  async showToast(msg: string) {
    let toast = await this.toastCtrl.create({
      message: msg,
      position: 'middle',
      duration: 2000
    });
    toast.present();
  }
  async showLoading(msg: string) {
    this.loading = await this.loadingCtrl.create({
      duration: 5000,
      message: msg,
    });
    this.loading.present();
  }

  loginSuccess() {
    this.userService.getHomeInfo().subscribe(res => {
      console.log(res);
      this.userInfo = res;
      this.username=res.CustomerNo;
      this.customerType=res.Classify;
      this.currencyAmount = res.CurrencyAmount;
      this.waitToSignTaskCount = res.WaitToSignTaskCount;
      let tempMenus = this.allMenus.filter(p => {
        return p.type.indexOf(this.customerType) > -1;
      });
      let rowIndex = 0;
      this.menus.rows = [];
      for (var i = 0; i < tempMenus.length; i++) {
        if (i % 3 == 0) {
          let newRow = new MenuRow();
          newRow.items = [];
          this.menus.rows.push(newRow);
          if (i > 0)
            rowIndex++;
        }
        this.menus.rows[rowIndex].items.push(tempMenus[i]);
      }
  
      if (this.plt.is("hybrid")) {
        this.jpush.getRegistrationID().then(res=>{
          let platform:string="";
          if(this.plt.is("android"))
            platform="android";
          else if(this.plt.is("iphone"))
            platform="iphone";
          this.userService.logined(res,platform).subscribe(data=>{
            console.log(data);
          });
        })
      }
      
      // if(this.customerType==3){
      //   this.navCtrl.navigateForward("/member/distribute-manager",{replaceUrl:true});
      // }
    });

  

    


    

  }

  menuClick(item) {


    if (item.url == "") {
      this.showToast('功能升级中...');
    }
    else {
      this.router.navigateByUrl(item.url);
    }

  }
  IsMicroMessenger(): boolean {
    let ua = navigator.userAgent.toLowerCase();
    let m = ua.match(/MicroMessenger/i);

    if (m != null && m.toString() == "micromessenger") {
      return true;
    }
    return false;
  }
  logOff() {
    this.userService.logOff().subscribe(res => {
      this.isLogin = false;
    });
  }
  openMessage() {
    this.router.navigateByUrl("/member/unread-message-list");
  }
  openChat() {
    //this.router.navigateByUrl("/member/chat/0");
    this.router.navigate(["/member", "chat", 0])
  }
  wechatPay(id){
    this.router.navigateByUrl("/member/wechat-pay/0?cid="+id);
  }
  goToTest() {
    this.router.navigateByUrl("/member/test");
  }
}
