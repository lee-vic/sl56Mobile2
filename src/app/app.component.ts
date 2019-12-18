import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { TabsService } from './providers/tabs.service';
import { JPush } from '@jiguang-ionic/jpush/ngx';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
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
      }
      
    });
  }
}
