import { AlertController, NavController, LoadingController } from '@ionic/angular';
import { WarehouseApplicationService } from './../../../providers/warehouse-application.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WarehouseApplication } from 'src/app/interfaces/warehouse-application';

@Component({
  selector: 'app-warehouse-application-detail',
  templateUrl: './warehouse-application-detail.page.html',
  styleUrls: ['./warehouse-application-detail.page.scss']
})
export class WarehouseApplicationDetailPage implements OnInit {
  form: FormGroup;
  status: number = 0; //0初始，1已收款，2已入仓，9已取消
  id: number = null;
  sourceList = [
    { value: '国际快递', text: '国际快递' },
    { value: '国内快递', text: '国内快递' },
    { value: '自行送货', text: '自行送货' },
    { value: '司机提取', text: '司机提取' }
  ];

  constructor(private fb: FormBuilder,
    private route: ActivatedRoute,
    private service: WarehouseApplicationService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController) {
    this.form = this.fb.group({
      ReferenceNumber: ['', [Validators.required, Validators.pattern('^[A-Z0-9]{8,32}$')]],
      Piece: [null, [Validators.required, Validators.min(1)]],
      Source: ['', Validators.required],
      Amount: [{ value: null, disabled: true }]
    });
  }

  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get("id");
    if (this.id > 0) {
      this.service.detail(this.id).subscribe(res => {
        if (res.Success)
          this.fillForm(res.Data);
        else
          this.alertCtrl.create({
            header: '操作失败',
            message: res.ErrMsg,
            buttons: ['确定']
          })
      });
    }
    const referenceNoControl = this.form.get('ReferenceNumber');
    if (referenceNoControl) {
      referenceNoControl.valueChanges.subscribe(value => {
        const upperValue = value.toUpperCase();
        referenceNoControl.setValue(upperValue, { emitEvent: false });
      });
    }
    const pieceControl = this.form.get('Piece');
    if (pieceControl) {
      pieceControl.valueChanges.subscribe(value => {
        this.calculateAmount(value);
      });
    }
  }

  // onReferenceNumberInput(event: Event): void {
  //   const input = event.target as HTMLInputElement;
  //   const upperValue = input.value.toUpperCase();
  //   input.value = upperValue;
  //   this.form.get('ReferenceNumber').setValue(upperValue, { emitEvent: false });
  // }

  fillForm(data: WarehouseApplication): void {
    this.form.patchValue({
      ReferenceNumber: data.ReferenceNumber,
      Piece: data.Piece,
      Source: data.Source,
      Amount: data.Amount
    });
    this.status = data.Status;
  }

  calculateAmount(piece: number): void {
    const amount = piece <= 10 ? 143 : 285;
    const amountControl = this.form.get('Amount');
    if (amountControl) {
      amountControl.setValue(amount);
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.alertCtrl.create({
        header: '信息填写不完善或者不符合要求',
        message: '请先检查完善后再保存',
        buttons: ['确定']
      }).then(alert => alert.present());
    } else {
      this.loadingCtrl.create({ message: '请稍候...' }).then(loading => loading.present());
      let submitObj: WarehouseApplication = {
        ...this.form.value,
        Amount: this.form.get('Amount').value,
        Status: this.status
      };
      this.service.save(submitObj).subscribe(res => {
        this.loadingCtrl.dismiss();
        if (!res.Success) {
          this.alertCtrl.create({
            header: '操作失败',
            message: res.ErrMsg,
            buttons: ['确定']
          }).then(alert => alert.present());
        } else {
          this.navCtrl.back();
        }
      });
    }
  }

  cancel() {
    this.alertCtrl.create({
      message: '确定要取消此申请吗？',
      header: '提示',
      buttons: [{
        text: "确认", handler: () => {
          this.loadingCtrl.create({ message: '正在取消...' }).then(loading => loading.present()).then(() => {
            this.service.cancel(this.id).subscribe(res => {
              this.loadingCtrl.dismiss();
              if (res.Success) {
                this.navCtrl.back();
              } else {
                this.alertCtrl.create({
                  header: '操作失败',
                  message: res.ErrMsg,
                  buttons: ['确定']
                }).then(alert => alert.present());
              }
            }, (err) => {
              this.loadingCtrl.dismiss();
              this.alertCtrl.create({
                header: '操作失败',
                message: err.message,
              }).then(alert => alert.present());
            });
          });
        }
      }, "取消"],
      cssClass: 'alert-confirm'
    }).then(alert => alert.present());
  }
}
