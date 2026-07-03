import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { SubAccountService } from 'src/app/providers/sub-account.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-sub-account',
  templateUrl: './sub-account.page.html',
  styleUrls: ['./sub-account.page.scss'],
})
export class SubAccountPage implements OnInit {
  items: Array<SubAccount> = [];
  isLoading = false;
  isLoaded = false;
  loadError = false;

  constructor(
    public navCtrl: NavController,
    private service: SubAccountService,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
  }

  ngOnInit(): void {
    this.getList();
  }

  getList(event?: CustomEvent): void {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.loadError = false;
    this.service.getList().subscribe({
      next: res => {
        this.items = res || [];
        this.isLoaded = true;
        this.isLoading = false;
        this.completeEvent(event);
      },
      error: () => {
        this.loadError = true;
        this.isLoaded = true;
        this.isLoading = false;
        this.completeEvent(event);
        this.uiFeedbackService.presentToast('子账号列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event: CustomEvent): void {
    this.getList(event);
  }

  add(): void {
    this.navCtrl.navigateForward('/member/sub-account-detail/');
  }

  detail(item: SubAccount): void {
    this.navCtrl.navigateForward(`/member/sub-account-detail/${item.ObjectId}`);
  }

  trackByObjectId(_index: number, item: SubAccount): number {
    return item.ObjectId;
  }

  getContactName(item: SubAccount): string {
    return item.ContactName || '未命名子账号';
  }

  private completeEvent(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement;
    if (target && typeof target.complete === 'function') {
      target.complete();
    }
  }
}
