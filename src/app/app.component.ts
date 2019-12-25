import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TabsService } from './providers/tabs.service';
import { JPush } from '@jiguang-ionic/jpush/ngx';
import { CodePush,SyncStatus } from '@ionic-native/code-push/ngx';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private codePush:CodePush,
    private splashScreen: SplashScreen,
    public tabs: TabsService,
    private jpush:JPush,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
     
      if(this.platform.is("hybrid")){
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        this.jpush.init();
        this.jpush.setDebugMode(true);

        this.codePush.sync({},(progress)=>{

        }).subscribe((syncStatus:SyncStatus)=>{
          if(syncStatus==SyncStatus.CHECKING_FOR_UPDATE){
            alert("正在检查更新");
          }
          if(syncStatus==SyncStatus.DOWNLOADING_PACKAGE){
            alert("正在下载更新包");
          }
          if(syncStatus==SyncStatus.IN_PROGRESS){
            alert("In Progress");
          }
          if(syncStatus==SyncStatus.INSTALLING_UPDATE){
            alert("正在安装更新");
          }
          if(syncStatus==SyncStatus.UP_TO_DATE){
            alert("Up to Update");
          }
          if(syncStatus==SyncStatus.UPDATE_INSTALLED){
            alert("更新已安装完毕");
          }
          if(syncStatus==SyncStatus.ERROR){
            alert("Code Push出现错误");
          }
  
        });
      }
      
    });
  }
}
