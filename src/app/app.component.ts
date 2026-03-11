import { Component } from '@angular/core';

import { ToastController, NavController } from '@ionic/angular';
import { TabsService } from './providers/tabs.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    public tabs: TabsService,
    public toastCtrl: ToastController,
    public navCtrl: NavController
  ) {
    this.initializeApp();
  }

  initializeApp() {
    return;
  }
}
