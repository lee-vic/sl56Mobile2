import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { Register } from 'src/app/interfaces/register';
import { DistributeRegisterService } from 'src/app/providers/distribute-register.service';
import { UserService } from '../../../providers/user.service';

@Component({
  selector: 'app-distribute-register',
  templateUrl: './distribute-register.page.html',
  styleUrls: ['./distribute-register.page.scss']
})
export class DistributeRegisterPage implements OnInit {
  public myForm: FormGroup;
  data:Register;
  code:string;
  isAgreement=false;
  validation_messages={
    "mobilePhone":[
      {type:"required",message:"手机号码不能为空"},
      {type:"pattern",message:"手机号码格式不正确"}
    ],
    "verifyCode":[
      {type:"required",message:"验证码不能为空"}
    ],
    "password":[
      {type:"required",message:"密码不能为空"},
      {type:"pattern",message:"长度为8-16位并且是字母和数字的组合"}
    ],
    "rePassword":[
      {type:"required",message:"确认密码不能为空"},
      {type:"pattern",message:"长度为8-16位并且是字母和数字的组合"}
    ]
  }
  constructor(public navCtrl: NavController, 
    public formBuilder: FormBuilder,
    private service:DistributeRegisterService,
    public toastCtrl: ToastController,
    public route:ActivatedRoute,
    public userService:UserService
    ) {
    this.myForm = this.formBuilder.group({
      mobilePhone: ['', Validators.compose([
        Validators.required,
        Validators.pattern("^1[3|4|5|6|7|8|9][0-9]{9}$")])],
      verifyCode:['',Validators.required],
      password: ['',Validators.compose([
        Validators.required,
        Validators.pattern("^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$")])],
      rePassword: ['',Validators.compose([
        Validators.required,
        Validators.pattern("^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$")])],
      code:[this.route.snapshot.queryParams.code]
    });
    this.data=new Register();
  }
  ngOnInit(): void {
    //已登录时，直接跳转
    this.userService.isAuthenticated().subscribe(res=>{
      this.navCtrl.navigateForward("/app/tabs/member");
    });
  }

  sendCode(){
    if(this.myForm.controls["mobilePhone"].status=="INVALID")return;
    this.service.sendcode(this.myForm.controls["mobilePhone"].value).subscribe(res=>{
      if(res.length>0){
        let toast = this.toastCtrl.create({
          message: res,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
      }else{
        let toast = this.toastCtrl.create({
          message: "验证码已发送，请注意查收",
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
      }
    });
  }
  doNext(formValue):void{

    console.log(formValue);
    this.data.MobilePhone1=formValue.mobilePhone;
    this.data.Password=formValue.password;
    this.data.RePassword=formValue.rePassword;
    this.data.VerifyCode=formValue.verifyCode;
    this.data.Code=formValue.code;
    this.service.register(this.data).subscribe(res=>{
      if(res.length==0){
        let toast = this.toastCtrl.create({
          message: "注册成功，即将跳转登录界面",
          position: 'middle',
          duration: 1000
        }).then(p=>p.present());
       
        setTimeout(() => {
          this.navCtrl.navigateForward("/app/tabs/member");
        }, 1000);
      }
      else{
        console.log("regfail:",res);
        let toast = this.toastCtrl.create({
          message: res,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
     
      }
    });
  }

}
