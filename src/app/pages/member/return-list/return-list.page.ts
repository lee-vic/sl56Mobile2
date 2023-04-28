import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, IonSearchbar, ToastController, AlertController, NavController, IonInput } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';

@Component({
  selector: "app-return-list",
  templateUrl: "./return-list.page.html",
  styleUrls: ["./return-list.page.scss"],
})
export class ReturnListPage implements OnInit {
  items1: Array<any> = [];
  items2: Array<any> = [];
  currentPageIndex: number = 1;
  isBusy: boolean = false;
  tempPhone: string = "";
  dateTimeNow: Date = new Date();
  @ViewChild(IonInfiniteScroll, { static: false })
  infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonSearchbar, { static: false }) searchbar: IonSearchbar;
  ngOnInit(): void {
    this.getItems1("", false);
  }
  tab = "1";
  constructor(
    public navCtrl: NavController,
    public service: ReturnService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ionViewDidLoad() {
    console.log("ionViewDidLoad ReturnListPage");
  }
  scrollItems($event) {
    this.getItems1(this.searchbar.value, true);
  }
  getItems1(key: string, isScroll: boolean) {
    if (this.isBusy == true) return;
    this.isBusy = true;
    this.service.getList1(this.currentPageIndex, key).subscribe((res) => {
      let flag = res.length < 10;

      for (var i = 0; i < res.length; i++) {
        this.items1.push(res[i]);
      }
      this.currentPageIndex++;
      if (isScroll) this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
  getItems2() {
    this.service.getList2().subscribe((res) => {
      this.items2 = res;
      this.items2.forEach((element) => {
        let val: string = element.ReferenceNumber;
        let tempArray = new Array();
        let vals = val.split(",");
        vals.forEach((ele) => {
          tempArray.push(ele.split("_")[1]);
        });
        element.ReferenceNumber = tempArray.toString();
      });
    });
  }
  getIsExpiredTimeOut(item) {
    if (new Date(item.ExpiredTime) < this.dateTimeNow) {
      return true;
    } else {
      return false;
    }
  }
  editMobilePhone(item) {
    this.tempPhone = item.MobilePhone;
    item.isEditMobilePhone = true;
  }
  cancelMobilePhone(item) {
    this.tempPhone = "";
    item.isEditMobilePhone = false;
  }
  submitMobilePhone(item) {
    console.log(item);
    if (this.tempPhone.trim().length == 0) {
      this.alertCtrl
        .create({
          header: "提示",
          message: "手机号码不能为空！",
          buttons: ["确定"],
        })
        .then((p) => p.present());
      return;
    }
    this.service
      .updateMobilePhone(item.ObjectId, this.tempPhone)
      .subscribe((res) => {
        if (res.length > 0) {
          this.alertCtrl
            .create({
              header: "提示",
              message: res,
              buttons: ["确定"],
            })
            .then((p) => p.present());
        } else {
          item.MobilePhone = this.tempPhone;
          item.isEditMobilePhone = false;
        }
      });
  }
  resetPickupCode(item) {
    this.service
      .resetPickupCode(item.ObjectId)
      .subscribe((res) => {
        if (res.length > 0) {
          this.alertCtrl
            .create({
              header: "提示",
              message: res,
              buttons: ["确定"],
            })
            .then((p) => p.present());
        } else {
          this.alertCtrl
            .create({
              header: "提示",
              message: "操作成功，请刷新页面查看或者稍后留意手机短信！",
              buttons: ["确定"],
            })
            .then((p) => p.present());
        }
      });
  }
  searchItems() {
    let val = this.searchbar.value;
    let key = val.trim();
    this.currentPageIndex = 1;
    this.items1.length = 0;
    this.getItems1(key, false);
  }
  detail(item) {
    this.navCtrl.navigateForward("/member/delivery-record/detail/" + item.Id);
  }
  cancelApply(item) {
    this.alertCtrl
      .create({
        header: "提示",
        message: "确定要取消当前退货申请吗?",
        buttons: [
          {
            text: "取消",
            role: "cancel",
          },
          {
            text: "确定",
            handler: () => {
              this.service.terminate(item.ObjectId).subscribe((res) => {
                if (res.Success == true) {
                  this.getItems2();
                  this.toastCtrl
                    .create({
                      message: "您的退货申请已成功取消",
                      duration: 3000,
                      position: "middle",
                    })
                    .then((p) => p.present());
                }
              });
            },
          },
        ],
      })
      .then((p) => p.present());
  }
  fill(item) {
    // this.navCtrl.push(UserReturnApplyPage, {
    //   id: item.ObjectId,
    //   type:1
    // });
  }
  ionViewWillEnter() {
    console.log("ionViewWillEnter");
    this.getItems2();
  }
}
