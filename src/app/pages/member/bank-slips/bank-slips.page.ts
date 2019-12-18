import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { BankSlips } from 'src/app/interfaces/bank-slips';
import { BankSlipsService } from 'src/app/providers/bank-slips.service';
import { AlertController, NavController, IonInfiniteScroll } from '@ionic/angular';
import { apiUrl } from 'src/app/global';

@Component({
  selector: 'app-bank-slips',
  templateUrl: './bank-slips.page.html',
  styleUrls: ['./bank-slips.page.scss'],
})
export class BankSlipsPage implements OnInit {

  ngOnInit(): void {
    this.getItems();
  }
  public form: FormGroup;
  @ViewChild('fileInput',{static:true}) fileInput: ElementRef;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  isBusy: boolean = false;
  currentPageIndex: number = 1;
  items: BankSlips[] = [];
  constructor(public navCtrl: NavController,
    public formBuilder: FormBuilder,
    public service: BankSlipsService,
    public alertCtrl: AlertController) {
    this.form = this.formBuilder.group({

      file: null
    });
  }

  


  onFileChange(event) {

    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      reader.readAsDataURL(file);
      reader.onload = () => {
        let fileContent:string=String(reader.result);
        this.form.get('file').setValue({
          name: file.name,
          type: file.type,
          value: fileContent.split(',')[1]
        });

        this.service.upload(this.form.value.file).subscribe(res => {
          if(res.Success){
            this.refreshList();
          }

        });
      };
    }
  }

  doSubmit(event) {
    let el: HTMLElement = this.fileInput.nativeElement as HTMLElement;
    el.click();
  }

  getItems() {
    if (this.isBusy == true)
      return;
    this.isBusy = true;
    this.service.getList(this.currentPageIndex).subscribe(res => {

      if (res.length < 15 && this.infiniteScroll != null) {
        this.infiniteScroll.disabled=true;
      }
      for (var i = 0; i < res.length; i++) {
        res[i].Url = apiUrl + "/UploadBankSlips/Detail/" + res[i].Id;
        this.items.push(res[i]);
      }
      this.currentPageIndex++;
      if (this.infiniteScroll != null)
      this.infiniteScroll.complete();
      this.isBusy = false;
    });
  }
  delete(id) {

    let confirm = this.alertCtrl.create({
      header: '确认删除当前回单?',

      buttons: [
        {
          text: '取消'
        },
        {
          text: '确认',
          handler: () => {
            this.doDelete(id);
          }
        }
      ]
    }).then(p=>p.present());
   
  }
  doDelete(id) {
    this.service.delete(id).subscribe(res => {
      console.log(res);
      if (!res.Success) {
        const alert = this.alertCtrl.create({
          header: '删除失败',
          subHeader: res.ErrMsg,
          buttons: ['确定']
        }).then(p=>p.present());
      
      }
      else{
        this.refreshList();
      }
    });
  }
  refreshList(){
    this.currentPageIndex=1;
    this.items.length=0;
    this.getItems();
  }

}
