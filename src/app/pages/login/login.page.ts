import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
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
  public isLoggingIn = false;

  constructor(public formBuilder: FormBuilder,
    public toastCtrl: ToastController,
    private router: Router,
    private userService: UserService,
    private cookieService: CookieService) {
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
    this.isLoggingIn = true;
    // Web application - always set clientType to web
    formValue.clientType = 1;
    formValue.openId = this.cookieService.get('OpenId');
    formValue.unionId = this.cookieService.get('UnionId');
    this.userService.auth(formValue).subscribe({
      next: (res: any) => {
        this.isLoggingIn = false;
        this.isLogin =  res.Success;
        console.log("aa" + this.cookieService.get('sl56Auth'));

        if (this.isLogin) {
          this.router.navigateByUrl(this.cookieService.get('State'));
        }
        else {
          this.toastCtrl.create({
            message: res.ErrMsg,
            position: 'middle',
            duration: 1500
          }).then(p => p.present());

        }
      },
      error: (err) => {
        this.isLoggingIn = false;
        this.toastCtrl.create({
          message: err.message,
          position: 'middle',
          duration: 3000
        }).then(p => p.present());

      }
    });

  }
  forgetPasswordClick() {
    this.router.navigateByUrl("/member/reset-password");
  }
  getCookie() {
    console.log(this.cookieService.get('OpenId'));
    console.log(this.cookieService.get('UnionId'));
    console.log(this.cookieService.get('State'));
  }

}
