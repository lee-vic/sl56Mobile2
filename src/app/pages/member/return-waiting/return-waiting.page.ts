import { Component, OnInit } from '@angular/core';
import{ AlertController,NavController, ToastController} from '@ionic/angular';
import{ReturnService} from 'src/app/providers/return.service';
import{DeliveryRecord} from 'src/app/interfaces/delivery-record';
import { NavigationEnd, Router} from '@angular/router';
import { WaitingReturnEventsService } from 'src/app/providers/waiting-return-events.service';

@Component({
  selector: 'app-return-waiting',
  templateUrl: './return-waiting.page.html',
  styleUrls: ['./return-waiting.page.scss']
})
export class ReturnWaitingPage implements OnInit {
  items:Array<DeliveryRecord>=[];
  selectedCount:number=0;
  isMutating = false;
  navigationSubscription;
  constructor(
    public service:ReturnService,
    public alert:AlertController,
    public navCtrl:NavController,
    public toastCtrl: ToastController,
    private waitingReturnEventsService: WaitingReturnEventsService,
    private router: Router) {
      this.navigationSubscription = this.router.events.subscribe((event: any) => {
        if (event instanceof NavigationEnd) {
          this.getWaitingReturnList();
        }
       });
     }

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  get allSelected(): boolean {
    return this.hasItems && this.selectedCount === this.items.length;
  }

  get canRemove(): boolean {
    return !this.isMutating && this.selectedCount > 0;
  }

  get canClear(): boolean {
    return !this.isMutating && this.hasItems;
  }

  get canSubmit(): boolean {
    return !this.isMutating && this.selectedCount > 0;
  }

  get applyButtonText(): string {
    if (this.isMutating) {
      return '处理中...';
    }
    return `提交退货申请 (${this.selectedCount})`;
  }

  ngOnInit(): void {
    // this.getWaitingReturnList();
  }

  ngOnDestroy(): void {
    if (this.navigationSubscription) {
     this.navigationSubscription.unsubscribe();
    }
  }
  
  check(item:DeliveryRecord){
    if (this.isMutating) {
      return;
    }
    item.Selected = !item.Selected;
    this.updateSelectedCount();
  }

  getWaitingReturnList(){
    this.service.getWaitReturnList().subscribe(res=>{
        this.items = (res || []).map(item => ({ ...item, Selected: true }));
        this.updateSelectedCount();
    });
  }

  remove(){
    if (this.isMutating) {
      return;
    }
    if(this.selectedCount===0){
      this.presentToast('请先选择要移除的单号');
      return;
    }
    this.isMutating = true;
    let ids = this.items.filter(p=>p.Selected).map(p=>p.Id).toString();
    this.service.removeWaitReturnList(ids).subscribe(_ => {
      this.items = this.items.filter(p=>!p.Selected);
      this.updateSelectedCount();
      this.isMutating = false;
      this.waitingReturnEventsService.notifyReloadWaitingReturn();
      this.presentToast('已移除所选单号');
    }, _ => {
      this.isMutating = false;
      this.presentToast('移除失败，请稍后重试');
    });
  }

  removeOne(item: DeliveryRecord, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (this.isMutating || !item || !item.Id) {
      return;
    }

    this.isMutating = true;
    this.service.removeWaitReturnList(item.Id.toString()).subscribe(_ => {
      this.items = this.items.filter(p => p.Id !== item.Id);
      this.updateSelectedCount();
      this.isMutating = false;
      this.waitingReturnEventsService.notifyReloadWaitingReturn();
      this.presentToast('已移除该记录');
    }, _ => {
      this.isMutating = false;
      this.presentToast('移除失败，请稍后重试');
    });
  }

  async clear(){
    if (this.isMutating) {
      return;
    }
    if(this.items.length==0) return;
    const alert = await this.alert.create({
      header: '清空待退货列表',
      message: '清空后需重新从交货记录添加，确认清空吗？',
      buttons: [
        {
          text: '取消'
        }, {
          text: '确认清空',
          handler: () => {
            this.isMutating = true;
            this.service.clearWaitReturnList().subscribe(_ => {
              this.items=[];
              this.updateSelectedCount();
              this.isMutating = false;
              this.waitingReturnEventsService.notifyReloadWaitingReturn();
              this.presentToast('待退货列表已清空');
            }, _ => {
              this.isMutating = false;
              this.presentToast('清空失败，请稍后重试');
            });
          }
        }
      ]
    });

    await alert.present();
  }

  goReturn(){
    if (this.isMutating) {
      return;
    }
    if(this.selectedCount===0){
      this.presentToast('请先选择要申请退货的单号');
      return;
    }
    let ids =this.items.filter(p=>p.Selected).map(p=>p.Id).toString();
    this.navCtrl.navigateForward("/member/return-apply", { queryParams: { type: 0,ids:ids } })
  }

  selectAll(event?: CustomEvent){
    if (this.isMutating) {
      return;
    }
    let checked = event ? !!(event.detail as any).checked : !this.allSelected;
    this.items.forEach(item=>{
      item.Selected=checked;
    });
    this.updateSelectedCount();
  }

  back(){
    this.waitingReturnEventsService.notifyReloadWaitingReturn();
  }

  private presentToast(message: string): void {
    this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'middle'
    }).then(p => p.present());
  }

  private updateSelectedCount(): void {
    this.selectedCount = this.items.filter(item => !!item.Selected).length;
  }

}
