import { Component, OnInit } from '@angular/core';
import { LoadingController, NavController } from '@ionic/angular';
import { finalize } from 'rxjs/operators';
import { FadadaSignTask } from 'src/app/interfaces/fadada-sign-task';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { FadadaService } from '../../../providers/fadada.service';

type ContractTab = '0' | '1' | '2';
type ContractActionType = -1 | 0 | 1 | 2 | 3 | 5;

@Component({
  selector: 'app-sign-the-contract',
  templateUrl: './sign-the-contract.page.html',
  styleUrls: ['./sign-the-contract.page.scss']
})
export class SignTheContractComponent implements OnInit {
  readonly tabs: Array<{ value: ContractTab; label: string; icon: string }> = [
    { value: '0', label: '待处理', icon: 'time-outline' },
    { value: '1', label: '已完成', icon: 'checkmark-done-outline' },
    { value: '2', label: '其他', icon: 'albums-outline' }
  ];

  list1: FadadaSignTask[] = [];
  list2: FadadaSignTask[] = [];
  list3: FadadaSignTask[] = [];
  showType: ContractTab = '0';
  isLoading = true;
  isLoaded = false;
  loadError = false;

  constructor(
    public faDaDaService: FadadaService,
    public navCtrl: NavController,
    private readonly loadingCtrl: LoadingController,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(event?: CustomEvent): void {
    this.isLoading = true;
    this.loadError = false;

    this.faDaDaService.getSignTasks().pipe(
      finalize(() => {
        this.isLoading = false;
        this.isLoaded = true;
        this.completeEvent(event);
      })
    ).subscribe({
      next: res => {
        this.applyTasks(res || []);
      },
      error: () => {
        this.applyTasks([]);
        this.loadError = true;
        this.uiFeedbackService.presentToast('合同列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }

  segmentChanged(event: CustomEvent): void {
    const value = String(event.detail.value) as ContractTab;
    if (this.tabs.some(tab => tab.value === value)) {
      this.showType = value;
    }
  }

  get showList(): FadadaSignTask[] {
    if (this.showType === '0') {
      return this.list1;
    }
    if (this.showType === '1') {
      return this.list2;
    }
    return this.list3;
  }

  get currentEmptyTitle(): string {
    return this.showType === '0' ? '暂无待处理合同' : this.showType === '1' ? '暂无已完成合同' : '暂无其他合同';
  }

  get currentEmptyText(): string {
    return this.showType === '0' ? '需要填写或签署的合同会显示在这里。' : '合同状态更新后会自动同步。';
  }

  get totalCount(): number {
    return this.list1.length + this.list2.length + this.list3.length;
  }

  getShowButtonType(row: FadadaSignTask): ContractActionType {
    let buttonType: ContractActionType = -1;
    if (this.showType === '0') {
      if (row.StatusIndex === 2) {
        if (row.ActorStatus === '待填写') {
          buttonType = 0;
        } else {
          buttonType = 3;
        }
      } else if (row.StatusIndex === 3 || row.StatusIndex === 4) {
        if (row.ActorStatus === '待签署') {
          buttonType = 1;
        } else {
          buttonType = 5;
        }
      }
    } else if (this.showType === '1') {
      buttonType = 2;
    }
    return buttonType;
  }

  getActionLabel(actionType: ContractActionType): string {
    if (actionType === 0) {
      return '填写合同';
    }
    if (actionType === 1) {
      return '签署合同';
    }
    if (actionType === 3) {
      return '等待填写';
    }
    if (actionType === 5) {
      return '等待签署';
    }
    return '查看合同';
  }

  getStatusColor(item: FadadaSignTask): string {
    if (item.StatusIndex < 6) {
      return 'primary';
    }
    if (item.StatusIndex === 6) {
      return 'success';
    }
    return 'medium';
  }

  getTabCount(tabValue: ContractTab): number {
    if (tabValue === '0') {
      return this.list1.length;
    }
    if (tabValue === '1') {
      return this.list2.length;
    }
    return this.list3.length;
  }

  trackBySignTaskId(_index: number, item: FadadaSignTask): string {
    return item.SignTaskId || `${item.ObjectId}-${item.ActorId}`;
  }

  async goToSignTask(item: FadadaSignTask): Promise<void> {
    await this.openSignUrl(item, false);
  }

  async goToPreview(item: FadadaSignTask): Promise<void> {
    await this.openSignUrl(item, true);
  }

  private applyTasks(items: FadadaSignTask[]): void {
    this.list1 = items.filter(item => item.StatusIndex < 6);
    this.list2 = items.filter(item => item.StatusIndex === 6);
    this.list3 = items.filter(item => item.StatusIndex > 6);
  }

  private async openSignUrl(item: FadadaSignTask, openInNewWindow: boolean): Promise<void> {
    const loading = await this.loadingCtrl.create({ message: '请稍候...' });
    await loading.present();

    this.faDaDaService.getSignTaskUrl(item.SignTaskId, item.ActorId).pipe(
      finalize(() => {
        loading.dismiss();
      })
    ).subscribe({
      next: res => {
        if (!res) {
          this.uiFeedbackService.presentToast('未获取到合同链接，请稍后重试', 2200, 'middle', undefined, 'warning');
          return;
        }
        if (openInNewWindow) {
          window.open(res, '_blank');
          return;
        }
        window.location.href = res;
      },
      error: () => {
        this.uiFeedbackService.presentToast('合同链接获取失败，请稍后重试', 2200, 'middle', undefined, 'danger');
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
