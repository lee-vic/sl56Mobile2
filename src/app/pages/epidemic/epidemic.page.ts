import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { EpidemicService } from 'src/app/providers/epidemic.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-epidemic',
  templateUrl: './epidemic.page.html',
  styleUrls: ['./epidemic.page.scss'],
})
export class EpidemicPage implements OnInit {
  public myForm: FormGroup;
  constructor(public formBuilder: FormBuilder,
    public alertController: AlertController,
    public service: EpidemicService) {
    this.myForm = this.formBuilder.group({
      val1: ['', Validators.required],
      val2: ['', Validators.required],
      val3: ['', Validators.required],
      val4: ['', Validators.required],
      val5: ['', Validators.required],
      val6: ['', Validators.required],
      val7: ['', Validators.required],
      val8: ['', Validators.required],
      val9: ['', Validators.required],
      val10: ['', Validators.required],
      val11: ['', Validators.required],
      val12: ['', Validators.required],
      val13: ['', Validators.required],
    });
   }

  ngOnInit() {
  }
  processForm(formValue){
    this.service.submit(formValue).subscribe(res=>{
     
      let data=JSON.parse(res);

      if(data["Success"]==true){
        this.presentAlert("已成功提交","","")
      }
      else{
        this.presentAlert("提交失败","请联系系统管理员","详细信息:"+data["ErrMsg"]);
      }
    },(err)=>{
      this.presentAlert("提交错误","请联系系统管理员","");
    });
  }
  async presentAlert(title,sTitle,msg) {
    const alert = await this.alertController.create({
      header: title,
      subHeader: sTitle,
      message: msg,
      buttons: ['确定']
    });

    await alert.present();
  }
}
