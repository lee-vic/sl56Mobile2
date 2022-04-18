import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { TabsService } from './providers/tabs.service';
import { SignalRModule } from 'ng2-signalr';
import { SignalRConfiguration } from 'ng2-signalr';
import { JPush } from '@jiguang-ionic/jpush/ngx';
import { CodePush } from '@ionic-native/code-push/ngx';
import { SimplePdfViewerModule} from 'simple-pdf-viewer';



export function createConfig(): SignalRConfiguration {
  const c = new SignalRConfiguration();
  c.hubName = 'chatGroupHub';

  c.url = 'https://signalr.sl56.com/signalr/hubs';
  c.logging = false;
  c.withCredentials=true;
  
  // >= v5.0.0
  c.executeEventsInZone = true; // optional, default is true
  c.executeErrorsInZone = false; // optional, default is false
  c.executeStatusChangeInZone = true; // optional, default is true
  return c;
}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      backButtonText:"返回",
    }),
    HttpClientModule,
    AppRoutingModule,
    SignalRModule.forRoot(createConfig),
    SimplePdfViewerModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    TabsService,
    JPush,
    CodePush,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
