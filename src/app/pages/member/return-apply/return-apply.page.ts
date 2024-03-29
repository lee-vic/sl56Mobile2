import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, AlertController, ToastController, ModalController, NavParams, IonButton, LoadingController } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';
import { ActivatedRoute } from '@angular/router';
import { ReturnApplyHistoryPage } from '../return-apply-history/return-apply-history.page';

@Component({
  selector: 'app-return-apply',
  templateUrl: './return-apply.page.html',
  styleUrls: ['./return-apply.page.scss'],
})
export class ReturnApplyPage implements OnInit {
  @ViewChild('btnSubmit', { static: true }) btnSubmit: IonButton;
  ids: any;
  data: any;
  type: any;
  ngOnInit(): void {
    //客户主动申请填写提货人资料
    if (this.type == 0) {
      this.service.apply(this.ids).subscribe(res => {
        this.data = res;
        if (res.AllowApply == false) {
          let alert = this.alertCtrl.create({
            header: '提示',
            message: res.ErrorMessage,
            buttons: [{
              text: "确定",
              role: "cancel",
              handler: () => {
                this.navCtrl.pop();
              }
            }]
          }).then(p => p.present());

        }
        else {
          this.applyForm.controls["RequiredDate"].setValue(res.RequiredDate);
          this.applyForm.controls["ReferenceNumber"].setValue(res.ReferenceNumber);
        }
      });
    }
    //内部发起填写提货人资料
    else if (this.type == 1) {
      this.service.fill(this.ids).subscribe(res => {
        this.applyForm.controls["RequiredDate"].setValue(res.RequiredDate);
        this.applyForm.controls["ReferenceNumber"].setValue(res.ReferenceNumber);
      });
    }

  }
  public applyForm: FormGroup;
  constructor(public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public service: ReturnService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public loadingController: LoadingController,
    private route: ActivatedRoute
  ) {
    this.type = this.route.snapshot.queryParams.type;
    this.ids = this.route.snapshot.queryParams.ids;
    this.applyForm = this.formBuilder.group({
      PersonName: ["", Validators.required],
      MobilePhone: [
        "",
        Validators.compose([Validators.required, Validators.pattern("^1[3|4|5|7|8][0-9]{9}$"),]),
      ],
      Remark: [""],
      RequiredDate: [],
      ReferenceNumber: [],
      IdList: this.ids,
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReturnApplyPage');
  }
  doSubmit(form) {
    if (this.type == 0) {
      this.doApply(form);
    }
    else {
      this.doFill(form);
    }

  }
  doApply(form) {
    this.btnSubmit.disabled = true;
    this.loadingController.create({
      message: '请稍后...',
    }).then(p=>{
      p.present();
    });
    this.service.apply1(form).subscribe(res => {
      this.loadingController.dismiss();
      if (res.IsSuccess == false) {
        this.btnSubmit.disabled = false;
        this.alertCtrl.create({
          header: '提示',
          message: res.ErrorMessage,
          buttons: ['确定']
        }).then(p => p.present());
      }
      else {
        this.toastCtrl.create({
          message: '您的退货申请已成功提交',
          duration: 3000,
          position: 'middle',
        }).then(p => {
          p.present();
          this.navCtrl.back();
        });
      }
    }, error => {
      this.btnSubmit.disabled = false;
      this.loadingController.dismiss();
      this.alertCtrl.create({
        header: '出现错误，请重试',
        message: '如果多次重试仍然失败，请联系您的服务专员',
        buttons: ['确定']
      }).then(p => p.present());
    }, () => {

    });
  }

  doFill(form) {
    this.service.fill1(form).subscribe(res => {
      if (res.IsSuccess == false) {
        let alert = this.alertCtrl.create({
          header: '提示',
          message: res.Message,
          buttons: ['确定']
        }).then(p => p.present());

      }
      else {
        let toast = this.toastCtrl.create({
          message: '您的提货人信息已成功提交',
          duration: 3000,
          position: 'middle'
        });

      }
    });
  }
  history() {
    this.presentModal();
  }
  async presentModal() {

    const modal = await this.modalCtrl.create({
      component: ReturnApplyHistoryPage
    });
    modal.onDidDismiss().then((ev) => {
      let val = ev.data['val'];
      if (val != undefined) {
        let vals = val.split(' ');
        this.applyForm.controls["PersonName"].setValue(vals[0]);
        this.applyForm.controls["MobilePhone"].setValue(vals[1]);
      
      }


    });
    return await modal.present();
  }
}
