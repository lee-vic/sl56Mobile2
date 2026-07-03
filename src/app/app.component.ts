import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, Renderer2 } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ToastController, NavController } from '@ionic/angular';
import { TabsService } from './providers/tabs.service';

interface ShadowHostElement extends HTMLElement {
  shadowRoot: ShadowRoot | null;
}

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
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private documentRef: Document
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.updateMemberCenterRouteClass(this.router.url);
    // Ionic 7 会在页面切换时给旧页面设置 aria-hidden；先清理焦点可避免浏览器抛出可访问性告警。
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.blurDeepActiveElement();
        this.updateMemberCenterRouteClass(event.url);
        return;
      }

      if (event instanceof NavigationEnd) {
        this.updateMemberCenterRouteClass(event.urlAfterRedirects);
      }
    });
    return;
  }

  private blurDeepActiveElement(): void {
    let current: Document | ShadowRoot = this.documentRef;
    let active = current.activeElement as HTMLElement | null;

    while (active && (active as ShadowHostElement).shadowRoot?.activeElement) {
      current = (active as ShadowHostElement).shadowRoot as ShadowRoot;
      active = current.activeElement as HTMLElement | null;
    }

    if (active && typeof active.blur === 'function' && active !== this.documentRef.body) {
      active.blur();
    }
  }

  private updateMemberCenterRouteClass(url: string): void {
    const normalizedUrl = (url || '').split('?')[0].split('#')[0].toLowerCase();
    const isMemberCenterRoute =
      normalizedUrl === '/app/tabs/member' ||
      normalizedUrl.startsWith('/app/tabs/member/') ||
      normalizedUrl === '/member' ||
      normalizedUrl.startsWith('/member/') ||
      normalizedUrl === '/distribute-register' ||
      normalizedUrl.startsWith('/distribute-register/') ||
      normalizedUrl === '/distribute-agreement' ||
      normalizedUrl.startsWith('/distribute-agreement/');

    if (isMemberCenterRoute) {
      this.renderer.addClass(this.documentRef.body, 'member-center-route');
      return;
    }

    this.renderer.removeClass(this.documentRef.body, 'member-center-route');
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.renderer.removeClass(this.documentRef.body, 'member-center-route');
  }
}
