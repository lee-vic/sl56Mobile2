import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { FaDaDaAuthInfoService } from './../../../providers/fadada-auth-info.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-info',
  templateUrl: './auth-info.page.html',
  styleUrls: ['./auth-info.page.scss']
})
export class AuthInfoPage implements OnInit {

  constructor(public service: FaDaDaAuthInfoService, public loadingCtrl: LoadingController, public alertCtrl: AlertController, public navCtrl: NavController) { }
  isAuth: boolean = false;
  ngOnInit(): void {
    this.loadingCtrl.create({
      message: '加载中...'
    }).then(p => p.present());
    this.service.getIsAuth().subscribe(res => {
      this.loadingCtrl.dismiss();
      if (!res) {
        this.alertCtrl.create({
          message: '信息未认证，是否进行认证？',
          buttons: [{
            text: '认证',
            handler: () => {
              this.loadingCtrl.create({
                message: '加载中...'
              }).then(p => p.present());
              this.service.getAuthUrl().subscribe(res => {
                this.loadingCtrl.dismiss();
                window.location.href = res;
              }, err => {
                this.loadingCtrl.dismiss();
                this.alertCtrl.create({
                  message: '操作异常，请重试，多次失败请联系业务员',
                  buttons: [{
                    text: '确定',
                    handler: () => {
                      this.navCtrl.back();
                    }
                  }],
                  backdropDismiss: false,
                }).then(p => p.present());
              });
            }
          }, {
            text: '取消',
            handler: () => {
              this.navCtrl.back();
            }
          }],
          backdropDismiss: false,
        }).then(p => p.present());
      } else {
        this.isAuth = true;
      }
    }
    );
  }

}
