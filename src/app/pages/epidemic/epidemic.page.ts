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
  public  isBusy:boolean=false;
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
    console.log(this.myForm.valid);
   }

  ngOnInit() {
  }
  processForm(formValue){
    this.isBusy=true;
    this.service.submit(formValue).subscribe(res=>{
     
      let data=JSON.parse(res);

      if(data["Success"]==true){
        this.presentAlert("已成功提交","","");
       this.myForm.controls["val1"].setValue("");
       this.myForm.controls["val2"].setValue("");
       this.myForm.controls["val3"].setValue("");
       this.myForm.controls["val4"].setValue("");
       this.myForm.controls["val5"].setValue("");
       this.myForm.controls["val6"].setValue("");
       this.myForm.controls["val7"].setValue("");
       this.myForm.controls["val8"].setValue("");
       this.myForm.controls["val9"].setValue("");
       this.myForm.controls["val10"].setValue("");
       this.myForm.controls["val11"].setValue("");
       this.myForm.controls["val12"].setValue("");
       this.myForm.controls["val13"].setValue("");
      }
      else{
        this.presentAlert("提交失败","请联系系统管理员","详细信息:"+data["ErrMsg"]);
      }
      this.isBusy=false;
    },(err)=>{
      this.presentAlert("提交错误","请联系系统管理员","");
      this.isBusy=false;
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
