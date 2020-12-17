import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, AlertController, ToastController, ModalController, NavParams, IonButton } from '@ionic/angular';
import { ReturnService } from 'src/app/providers/return.service';
import { ActivatedRoute } from '@angular/router';
import { ReturnApplyHistoryPage } from '../return-apply-history/return-apply-history.page';

@Component({
  selector: 'app-return-apply',
  templateUrl: './return-apply.page.html',
  styleUrls: ['./return-apply.page.scss'],
})
export class ReturnApplyPage implements OnInit {
  @ViewChild('btnSubmit',{static:true}) btnSubmit: IonButton;
  id: any;
  data: any;
  type: any;
  ngOnInit(): void {
    //客户主动申请填写提货人资料
    if (this.type == 0) {
      this.service.apply(this.id).subscribe(res => {
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
          }).then(p=>p.present());
         
        }
        else {
          this.applyForm.controls["RequiredDate"].setValue(res.RequiredDate);
          this.applyForm.controls["ReferenceNumber"].setValue(res.ReferenceNumber);
        }
      });
    }
    //内部发起填写提货人资料
    else if (this.type == 1) {
      this.service.fill(this.id).subscribe(res => {
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
    private route: ActivatedRoute
    ) {
     this.type=this.route.snapshot.queryParams.type;
     this.id= this.route.snapshot.paramMap.get("id");
    this.applyForm = this.formBuilder.group({
      PersonName: ['', Validators.required],
      IDCardNumber: ['', [Validators.required, Validators.minLength(18), Validators.maxLength(18)]],
      PlateNumber: ['', Validators.pattern("([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1})")],
      Remark: [''],
      RequiredDate: [],
      ReferenceNumber: [],
      IdList: [this.id],
      WorkflowReturnGoodsId: [this.id]
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
    this.btnSubmit.disabled=true;
    this.service.apply1(form).subscribe(res => {
      this.btnSubmit.disabled=false;
      if (res.IsSuccess == false) {
        this.alertCtrl.create({
          header: '提示',
          message: res.ErrorMessage,
          buttons: ['确定']
        }).then(p=>p.present());
   
      }
      else {
        this.toastCtrl.create({
          message: '您的退货申请已成功提交',
          duration: 3000,
          position: 'middle',
        }).then(p=>{
          p.present();
          this.navCtrl.back();
        });
       
      }
    });
  }
  doFill(form) {
    this.service.fill1(form).subscribe(res => {
      if (res.IsSuccess == false) {
        let alert = this.alertCtrl.create({
          header: '提示',
          message: res.Message,
          buttons: ['确定']
        }).then(p=>p.present());
     
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
    modal.onDidDismiss().then((ev)=>{
      let val=ev.data['val'];
      if(val!=undefined){
        let vals = val.split(' ');
        this.applyForm.controls["PersonName"].setValue(vals[0]);
        this.applyForm.controls["IDCardNumber"].setValue(vals[1]);
        if (vals.length > 2)
          this.applyForm.controls["PlateNumber"].setValue(vals[2]);
      }

        
    });
    return await modal.present();
  }
}
