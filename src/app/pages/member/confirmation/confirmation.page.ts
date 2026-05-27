import { Component, OnInit } from '@angular/core';
import { ConfirmationService } from 'src/app/providers/confirmation.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { DeliveryRecord } from 'src/app/interfaces/delivery-record';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
})
export class ConfirmationPage implements OnInit {
  allSelected: boolean = false;
  total = 0;
  selectedCount: number = 0;
  selectedAmount: number = 0;
  isSubmitting: boolean = false;
  receiveGoodsDetailList: DeliveryRecord[] = [];
  searchList: DeliveryRecord[] = [];
  canGoback: boolean = true;
  constructor(public service: ConfirmationService, 
    public toastCtrl: ToastController, 
    public alertCtrl: AlertController, 
    public loadingCtrl: LoadingController,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.service.getReceiveGoodsDetailList().subscribe(res => {
      this.searchList = this.receiveGoodsDetailList = res;
      this.updateStats();
      this.updateAllSelectedState();
    });
    

  }
  onAllClick() {
    this.searchList.forEach(element => {
      element.Selected = this.allSelected;
    });
    this.updateStats();
  }

  onItemSelectionChange() {
    this.updateStats();
    this.updateAllSelectedState();
  }

  private updateAllSelectedState() {
    if (!this.searchList || this.searchList.length === 0) {
      this.allSelected = false;
      return;
    }
    this.allSelected = this.searchList.every(item => item.Selected === true);
  }

  updateStats() {
    this.selectedCount = this.receiveGoodsDetailList.filter(item => item.Selected === true).length;
    this.selectedAmount = this.receiveGoodsDetailList
      .filter(item => item.Selected === true)
      .reduce((sum, item) => sum + (parseFloat((item.Amount as any)?.toString?.() || item.Amount as any) || 0), 0);
  }

  getVisibleCount(): number {
    return this.searchList?.length || 0;
  }

  formatAmount(amount: any): string {
    const value = parseFloat((amount ?? 0).toString());
    return isNaN(value) ? '0.00' : value.toFixed(2);
  }

  trackByItemId(index: number, item: DeliveryRecord): any {
    return item.Id;
  }

  getItems(ev: CustomEvent) {
    const val = (ev.detail && ev.detail.value) ? ev.detail.value : '';
    console.log(val);
    if (val && val.trim() != '') {
      this.searchList = this.receiveGoodsDetailList.filter((item) => {
        return (item.ReferenceNumber.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
    else {
      this.searchList = this.receiveGoodsDetailList;
    }
    this.updateAllSelectedState();
    this.updateStats();
  }
  onItemConfirmClick(item: { Id: number | Number }) {
    this.alertCtrl.create({
      header: '确认出货?',
      message: '请仔细核实数据准确无误，运单确认后任何更改将收取操作费！',
      buttons: [
        {
          text: '取消'
        },
        {
          text: '确认',
          handler: () => {
            this.doConfirm(item.Id.toString());
          }
        }
      ]
    }).then(p => p.present());

  }
  onConfirmClick() {
    if (this.isSubmitting) {
      return;
    }

    let selectedItems = this.receiveGoodsDetailList.filter(item => {
      return item.Selected == true;
    }).map(item => item.Id);

    if (selectedItems == undefined || selectedItems.length == 0) {
      this.toastCtrl.create({
        message: '请选择需要确认的运单',
        position: 'middle',
        duration: 1500
      }).then(p => p.present());

    }
    else {
      this.alertCtrl.create({
        header: '确认出货?',
        message: '本次共选择' + selectedItems.length + "票.请仔细核实数据准确无误，运单确认后任何更改将收取操作费！",
        buttons: [
          {
            text: '取消'
          },
          {
            text: '确认',
            handler: () => {
              this.doConfirm(selectedItems.toString());
            }
          }
        ]
      }).then(p => p.present());

    }
  }
  doConfirm(selectedIdList: string) {
    if (this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;

    this.loadingCtrl.create({
      message: '请稍后...',
    }).then(p => p.present());

    this.service.confirm(selectedIdList).subscribe({
      next: (res) => {
        this.loadingCtrl.dismiss();
        this.isSubmitting = false;
        const confirmedCount = selectedIdList.split(',').filter(p => p && p.trim() !== '').length;
        this.searchList = this.receiveGoodsDetailList = res;
        this.allSelected = false;
        this.updateStats();
        this.updateAllSelectedState();
        this.toastCtrl.create({
          message: '已确认' + confirmedCount + '票运单',
          position: 'middle',
          duration: 1500,
          color: 'success'
        }).then(p => p.present());
      },
      error: (err) => {
        this.loadingCtrl.dismiss();
        this.isSubmitting = false;
        this.toastCtrl.create({
          message: err.message,
          position: 'middle',
          duration: 3000
        }).then(p => p.present());

      }
    });
  }
  detail(item: { Id: number | Number }) {
    this.router.navigate(["/member/delivery-record/detail",item.Id]);
  }

  goMemberCenter() {
    this.router.navigateByUrl('/app/tabs/member');
  }

}
