import { Component, OnDestroy } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ToastController, NavController } from '@ionic/angular';
import { TabsService } from './providers/tabs.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnDestroy {
  private routerSub?: Subscription;

  constructor(
    public tabs: TabsService,
    public toastCtrl: ToastController,
    public navCtrl: NavController,
    private router: Router
  ) {
    this.initializeApp();
  }

  initializeApp() {
    // Ionic 7 会在页面切换时给旧页面设置 aria-hidden；先清理焦点可避免浏览器抛出可访问性告警。
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.blurDeepActiveElement();
      }
    });
    return;
  }

  private blurDeepActiveElement(): void {
    let current: Document | ShadowRoot = document;
    let active = current.activeElement as HTMLElement | null;

    while (active && (active as any).shadowRoot?.activeElement) {
      current = (active as any).shadowRoot as ShadowRoot;
      active = current.activeElement as HTMLElement | null;
    }

    if (active && typeof active.blur === 'function' && active !== document.body) {
      active.blur();
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
