import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoadingController, ToastController, Platform } from '@ionic/angular';
import { CookieService } from 'ngx-cookie-service';
import { UserService } from 'src/app/providers/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  public authForm: FormGroup;

  public isLogin: boolean;
  constructor(public formBuilder: FormBuilder,
    public toastCtrl: ToastController,
    public plt: Platform,
    private router: Router,
    private userService: UserService,
    private cookieService: CookieService,
    public loadingCtrl: LoadingController,) {
    this.authForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      clientType: ['1'],
      userType: ['0'],
      rememberMe: [true],
      isBind: [true],
      openId: [''],
      unionId: ['']
    });
  }

  ngOnInit() {
  }

  doLogin(formValue) {

    this.loadingCtrl.create({
      message: '请稍后...',
    }).then(p => p.present());
    if (this.plt.is("mobileweb") || this.plt.is("desktop")) {
      formValue.clientType = 1;
      formValue.openId = this.cookieService.get('OpenId');
      formValue.unionId = this.cookieService.get('UnionId');
    }
    this.userService.auth(formValue).subscribe((res: any) => {
      this.isLogin =  res.Success;
      console.log("aa" + this.cookieService.get('sl56Auth'));
      this.loadingCtrl.dismiss();

      if (this.isLogin) {
        this.router.navigateByUrl(this.cookieService.get('State'));
        //this.navCtrl.push(this.cookieService.get('State'));
      }
      else {
        this.toastCtrl.create({
          message: res.ErrMsg,
          position: 'middle',
          duration: 1500
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
  forgetPasswordClick() {
    this.router.navigateByUrl("/member/reset-password");
  }
  getCookie() {
    console.log(this.plt.platforms())
    console.log(this.cookieService.get('OpenId'));
    console.log(this.cookieService.get('UnionId'));
    console.log(this.cookieService.get('State'));
  }

}
