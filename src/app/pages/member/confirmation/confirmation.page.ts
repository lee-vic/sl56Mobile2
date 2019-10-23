import { Component, OnInit } from '@angular/core';
import { ConfirmationService } from 'src/app/providers/confirmation.service';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.page.html',
  styleUrls: ['./confirmation.page.scss'],
})
export class ConfirmationPage implements OnInit {
  allSelected: boolean = false;
  total = 0;
  receiveGoodsDetailList: Array<any>;
  searchList: Array<any>;
  canGoback:boolean=true;
  constructor(public service: ConfirmationService, 
    public toastCtrl: ToastController, 
    public alertCtrl: AlertController, 
    public loadingCtrl: LoadingController,
    private location: Location,
    private router: Router
    ) { }

  ngOnInit(): void {
    this.service.getReceiveGoodsDetailList().subscribe(res => {
      this.searchList = this.receiveGoodsDetailList = res;
    });
    

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ConfirmationPage');
  }
  onAllClick() {
    this.searchList.forEach(element => {
      element.Selected = this.allSelected;
    });
  }
  getItems(ev: any) {
    let val = ev.target.value;
    console.log(val);
    if (val && val.trim() != '') {
      this.searchList = this.receiveGoodsDetailList.filter((item) => {
        return (item.ReferenceNumber.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    }
    else {
      this.searchList = this.receiveGoodsDetailList;
    }
  }
  onItemConfirmClick(item) {
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
  doConfirm(selectedIdList) {
    this.loadingCtrl.create({
      message: '请稍后...',
    }).then(p => p.present());

    this.service.confirm(selectedIdList).subscribe(res => {
      this.loadingCtrl.dismiss();
      this.searchList = this.receiveGoodsDetailList = res;
    }, (err) => {
      this.loadingCtrl.dismiss();
      this.toastCtrl.create({
        message: err.message,
        position: 'middle',
        duration: 3000
      }).then(p => p.present());

    });
  }
  detail(item) {
    this.router.navigate(["/member/delivery-record/detail",item.Id]);
    // this.navCtrl.push(UserDeliveryRecordDetailPage, {
    //   id: item.Id
    // });
  }

  goBack() {
    this.location.back();
  }
}
