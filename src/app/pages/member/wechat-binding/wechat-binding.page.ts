import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { WechatUser } from 'src/app/interfaces/wechat-user';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { WechatBindingService } from 'src/app/providers/wechat-binding.service';

@Component({
  selector: 'app-wechat-binding',
  templateUrl: './wechat-binding.page.html',
  styleUrls: ['./wechat-binding.page.scss'],
})
export class WechatBindingPage implements OnInit {
  list: WechatUser[] = [];
  isLoading = false;
  isLoaded = false;
  loadError = false;
  deletingId?: number;

  constructor(
    public service: WechatBindingService,
    public alertCtrl: AlertController,
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
        this.list = (res || []) as WechatUser[];
        this.isLoaded = true;
        this.isLoading = false;
        this.completeEvent(event);
      },
      error: () => {
        this.loadError = true;
        this.isLoaded = true;
        this.isLoading = false;
        this.completeEvent(event);
        this.uiFeedbackService.presentToast('微信绑定信息加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  refresh(event: CustomEvent): void {
    this.getList(event);
  }

  onItemDeleteClick(item: WechatUser): void {
    this.alertCtrl.create({
      header: '解除微信绑定',
      message: `解除后，${item.Name || '该微信账号'} 将不能继续用于快捷登录。`,
      buttons: [
        {
          text: '取消',
          role: 'cancel'
        },
        {
          text: '解除绑定',
          role: 'destructive',
          handler: () => this.deleteBinding(item)
        }
      ]
    }).then(alert => alert.present());
  }

  trackByWechatId(_index: number, item: WechatUser): number {
    return item.Id;
  }

  getInitial(item: WechatUser): string {
    return (item.ShortName || item.Name || '微').slice(0, 1);
  }

  deleteBinding(item: WechatUser): void {
    if (this.deletingId !== undefined) {
      return;
    }

    this.deletingId = item.Id;
    this.service.delete(item.Id).subscribe({
      next: res => {
        this.list = (res || []) as WechatUser[];
        this.deletingId = undefined;
        this.uiFeedbackService.presentToast('微信绑定已解除', 1600, 'middle', undefined, 'success');
      },
      error: () => {
        this.deletingId = undefined;
        this.uiFeedbackService.presentToast('解除绑定失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  private completeEvent(event?: CustomEvent): void {
    const target = event?.target as HTMLIonRefresherElement;
    if (target && typeof target.complete === 'function') {
      target.complete();
    }
  }
}
