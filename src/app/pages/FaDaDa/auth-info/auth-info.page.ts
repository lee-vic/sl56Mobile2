import { AlertController, NavController } from '@ionic/angular';
import { FaDaDaAuthInfoService } from './../../../providers/fadada-auth-info.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-auth-info',
  templateUrl: './auth-info.page.html',
  styleUrls: ['./auth-info.page.scss']
})
export class AuthInfoPage implements OnInit {

  constructor(public service: FaDaDaAuthInfoService, public alertCtrl: AlertController, public navCtrl: NavController) { }
  isAuth: boolean = false;
  isLoading = true;

  ngOnInit(): void {
    this.isLoading = true;
    this.service.getIsAuth().subscribe(res => {
      this.isLoading = false;
      if (!res) {
        this.alertCtrl.create({
          message: '信息未认证，是否进行认证？',
          buttons: [{
            text: '认证',
            handler: () => {
              this.service.getAuthUrl().subscribe({
                next: (res) => {
                  window.location.href = res;
                },
                error: (_err) => {
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
                }
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
