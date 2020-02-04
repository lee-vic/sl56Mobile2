import { Component } from '@angular/core';

import { Platform, ToastController, NavController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TabsService } from './providers/tabs.service';
import { JPush } from '@jiguang-ionic/jpush/ngx';
import { CodePush, SyncStatus } from '@ionic-native/code-push/ngx';



@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private codePush: CodePush,
    private splashScreen: SplashScreen,
    public tabs: TabsService,
    private jpush: JPush,
    public toastCtrl: ToastController,

    public navCtrl: NavController,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {

      if (this.platform.is("hybrid")) {
        this.statusBar.styleLightContent();
        this.splashScreen.hide();
        this.jpush.init();
        this.jpush.setDebugMode(true);
        document.addEventListener("jpush.openNotification", (event?: any) => {
          console.log(event);
          this.navCtrl.navigateForward(event.extras.route);
        }, false);
        this.codePush.sync({}, (progress) => {

        }).subscribe((syncStatus: SyncStatus) => {

          if (syncStatus == SyncStatus.DOWNLOADING_PACKAGE) {

            // this.toastCtrl.create({
            //   message: "发现新版本,正在下载更新",
            //   position: 'middle',
            //   duration: 3000
            // }).then(p => p.present());
          }

          if (syncStatus == SyncStatus.INSTALLING_UPDATE) {

            // this.toastCtrl.create({
            //   message: "正在安装更新",
            //   position: 'middle',
            //   duration: 3000
            // }).then(p => p.present());
          }

          if (syncStatus == SyncStatus.UPDATE_INSTALLED) {

            // this.toastCtrl.create({
            //   message: "更新已成功安装",
            //   position: 'middle',
            //   duration: 3000
            // }).then(p => p.present());
          }
          if (syncStatus == SyncStatus.ERROR) {
            // alert("Code Push出现错误");
          }

        });
      }

    });
  }
}
