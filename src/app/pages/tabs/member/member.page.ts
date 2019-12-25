import { Component, OnInit } from '@angular/core';
import { Menu,MenuRow,Menus } from '../../../interfaces/menu';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Platform, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UserService } from '../../../providers/user.service';
import { CookieService } from 'ngx-cookie-service';
import { User } from 'src/app/interfaces/user';

@Component({
  selector: 'app-member',
  templateUrl: './member.page.html',
  styleUrls: ['./member.page.scss'],
})
export class MemberPage implements OnInit {
  allMenus:Array<Menu>=[
    { title: "价格查询", image: "assets/imgs/member-2.png", type:[0,1],url:"/member/calculation" },
    { title: "偏远查询", image: "assets/imgs/member-3.png", type:[0,1],url:"/member/remote" },
    { title: "运单确认", image: "assets/imgs/member-5.png", type:[0] ,url:"/member/confirmation"},
    { title: "交货记录", image: "assets/imgs/member-6.png", type:[0,1],url:"/member/delivery-record/list" },
    { title: "模板下载", image: "assets/imgs/member-7.png", type:[0,1] ,url:"/member/template-list"},
    { title: "微信支付", image: "assets/imgs/member-8.png",type:[0,1] ,url:"/member/wechat-pay/0"},
    { title: "查看报价", image: "assets/imgs/member-10.png", type:[0],url:"/member/price-list" },
    { title: "修改密码", image: "assets/imgs/member-11.png", type:[0],url:"/member/modify-password"},
    { title: "子账号管理", image: "assets/imgs/member-12.png", type:[0],url:"/member/sub-account"},
    { title: "微信绑定", image: "assets/imgs/member-13.png", type:[0,1],url:"/member/wechat-binding" },
    { title: "回单上传", image: "assets/imgs/member-17.png",type:[0,1] ,url:"/member/bank-slips"},
    { title: "问题跟进", image: "assets/imgs/member-18.png", type:[0,1],url:"/member/problem-list" },
    { title: "业务公告", image: "assets/imgs/member-19.png",type:[0] ,url:"/member/notice-list"},
    { title: "退货管理", image: "assets/imgs/member-20.png", type:[0,1],url:"/member/return-list" },
    { title: "测试", image: "assets/imgs/member-20.png", type:[0,1] ,url:""}
  ];
  menus:Menus;
  isLogin: boolean = false;
  public authForm: FormGroup;
  public loading: any;
  userInfo: User;
  username: string = "";
  customerType:number;
  constructor(public toastCtrl: ToastController,
    public plt: Platform,
    private userService:UserService,
    private router: Router,
    private cookieService: CookieService,
    public loadingCtrl: LoadingController) {
    this.authForm = new FormGroup({
      username:new FormControl('',Validators.required),
      password: new FormControl('',Validators.required),
      clientType:new FormControl(''),
      userType:new FormControl(0,Validators.required),
      rememberMe:new FormControl(true,Validators.required),
      isBind:new FormControl(true,Validators.required),
      openId:new FormControl(''),
      unionId:new FormControl(''),
    });
   }

  ngOnInit() {
    this.loadingCtrl.create({
      message: '请稍后...'
    }).then(p=>{
      p.present();
      this.userService.isAuthenticated().subscribe(res => {
        this.loadingCtrl.dismiss();
        this.setLogin(true);
      }, (err) => {
        this.loadingCtrl.dismiss();
        if (err.status == 401) {
          this.setLogin(false);
        }
      });
    });

  
  }
  forgetPasswordClick(){
    this.router.navigateByUrl("/member/reset-password");
  }
  ionViewDidEnter(){
    console.log("ionViewDidEnter");
  }
  doLogin(formValue) {

   
    this.showLoading("请稍后...");
    if(this.plt.is("mobileweb")||this.plt.is("desktop")){
      formValue.clientType=1;
      formValue.openId=this.cookieService.get('OpenId');
      formValue.unionId=this.cookieService.get('UnionId');
    }
    this.userService.auth(formValue).subscribe((res)=>{
      this.setLogin("true"===res.toString());
      this.loading.dismiss();
      if(!this.isLogin){
        this.showToast('用户名或者密码错误，请重试');
      }
      else{
        localStorage.setItem("username",formValue.username);
      }
      
    },(err)=>{
      this.showToast(err.message);
    });

  }
  async showToast(msg:string){
    let toast = await this.toastCtrl.create({
      message: msg,
      position: 'middle',
      duration: 2000
    });
    toast.present();
  }
  async showLoading(msg:string) {
    this.loading = await this.loadingCtrl.create({
      duration: 5000,
      message: msg,
    });
    this.loading.present();
  }
  setUsername() {

    if(this.plt.is("hybrid")){
      this.username=localStorage.getItem("username");
    }
    else{
      if (this.cookieService.get('Username') != "")
      this.username = this.cookieService.get('Username');
    }
  
  }
  setLogin(val:boolean){
    this.isLogin=val;
    if(val){
      this.setUsername();
      this.getUserInfo();
     
       this.customerType=parseInt(this.cookieService.get('CustomerType'));
     
      if(isNaN(this.customerType)){
        this.customerType=0;
      }
     
    
      let tempMenus=this.allMenus.filter(p=>{
        return p.type.indexOf(this.customerType)>-1;
      });
      let rowIndex=0;
      this.menus=new Menus();
      this.menus.rows=[];
      for(var i=0;i<tempMenus.length;i++){
        if(i%3==0){
          let newRow=new MenuRow();
          newRow.items=[];
          this.menus.rows.push(newRow);
          if(i>0)
            rowIndex++;
        }
        this.menus.rows[rowIndex].items.push(tempMenus[i]);
      }
    }
    //this.content.resize();
  }
  getUserInfo() {
   
    this.userService.getHomeInfo().subscribe(res => {
      this.userInfo = res;
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
      this.setLogin(false);
    });
  }
  openMessage(){
    this.router.navigateByUrl("/member/unread-message-list");
  }
  openChat(){
   //this.router.navigateByUrl("/member/chat/0");
   this.router.navigate(["/member","chat",0])
  }
 
}
