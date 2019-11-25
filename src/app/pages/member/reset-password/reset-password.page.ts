import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UserService } from 'src/app/providers/user.service';
import { ToastController } from '@ionic/angular';
import { ForgotPassword } from 'src/app/interfaces/forgot-password';
import { Router } from '@angular/router';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
})
export class ResetPasswordPage implements OnInit {
  tab:string="1";
  tab2Disabled:boolean=true;
  tab3Disabled:boolean=true;
  tab4Disabled:boolean=true;
  public myForm1: FormGroup;
  public myForm2: FormGroup;
  public myForm3: FormGroup;
  data:ForgotPassword;
  codeText:string="获取验证码";
  btnDisabled: boolean = false;
  validation_messages = {
    "mobile": [
      { type: "required", message: "手机号码不能为空" },
      { type: "pattern", message: "手机号码格式不正确" }
    ],
    "code": [
      { type: "required", message: "验证码不能为空" },
      { type: "pattern", message: "验证码为6位数字" }
    ]
  }
  constructor(public formBuilder: FormBuilder,
    public toastCtrl: ToastController,
    private router: Router,
    private service:UserService,
    ) {
    this.myForm1 = this.formBuilder.group({
      username: ['', Validators.required],
    
    });
    this.myForm2 = this.formBuilder.group({
      mobile: ['', Validators.compose([
        Validators.required,
        Validators.pattern("^1[3|4|5|7|8][0-9]{9}$")
      ])],
      code: ['', Validators.compose([
        Validators.required,
        Validators.pattern("^[0-9]{6}$")
      ])],
    });
    this.myForm3 = this.formBuilder.group({
      newPassword1: ['', Validators.required],
      newPassword2: ['', Validators.required],
    });
   }
  
  ngOnInit() {
  }
  doNext1(formValue){
    this.service.forgotPassword(formValue.username).subscribe(res=>{
     
      if(res.Exists){
        this.tab="2";
        this.tab2Disabled=false;
        this.data=res;
        //this.navCtrl.push(UserForgotPassword1Page,{data:res});
      }
      else{
       this.toastCtrl.create({
          message: '你输入的账号不存在',
          position: 'middle',
          duration: 1500
        }).then(p=>p.present());
 
      }
    });
  }
  getCode(event){
    event.preventDefault();

    this.data.Mobile=this.myForm2.value.mobile;
    let errMsg: Array<string> = [];
    this.validation_messages.mobile.forEach(item => {
      if (this.myForm2.get('mobile').hasError(item.type))
        errMsg.push(item.message);
    });
    if (errMsg.length > 0) {
      let toast = this.toastCtrl.create({
        message: errMsg.toString(),
        position: 'middle',
        duration: 2000
      }).then(p=>p.present());
    }
    else{
      this.btnDisabled = true;
      this.service.getCode(this.data).subscribe(res=>{
        if(res.Success){
          let time: number = 60;
            let handle;
            setTimeout(() => {
              clearInterval(handle);
              this.codeText = "获取验证码";
              this.btnDisabled = false;
            }, time * 1000);
            handle = setInterval(() => {
              time--;
              this.codeText = time + "秒后重发";
            }, 1000);
        }
        else{
          this.toastCtrl.create({
            message: res.ErrMsg,
            position: 'middle',
            duration: 3000
          }).then(p=>p.present());
         
          this.btnDisabled = false;
        }
      });
    }
 
 
  }
  doNext2(formValue){
    this.data.Mobile=this.myForm2.value.mobile;
    this.data.Code=this.myForm2.value.code;
    this.service.forgotPassword1(this.data).subscribe(res=>{
      console.log(res);
      if(res.Success){
        this.data=res;
        this.tab="3";
        this.tab3Disabled=false;
        //this.navCtrl.push(UserForgotPassword2Page,{data:res});
      }
      else{
        let toast = this.toastCtrl.create({
          message: res.ErrMsg,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
 
      }
    });
  }
  doNext3(formValue) {
    this.data.NewPassword1=this.myForm3.value.newPassword1;
    this.data.NewPassword2=this.myForm3.value.newPassword2;
    this.service.forgotPassword2(this.data).subscribe(res=>{
      console.log(res);
      if(res.Success){
        this.tab="4";
        this.tab4Disabled=false;
        // let toast = this.toastCtrl.create({
        //   message: "新密码已成功设置",
        //   position: 'middle',
        //   duration: 1000
        // });
       
        // setTimeout(() => {
        //   this.navCtrl.popToRoot();
        //   this.navCtrl.pop();
        // }, 1000);
       
      }
      else{
        let toast = this.toastCtrl.create({
          message: res.ErrMsg,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());

      }
    });
  }
  toLogin(){
    this.router.navigateByUrl("/login");
  }
  
}
