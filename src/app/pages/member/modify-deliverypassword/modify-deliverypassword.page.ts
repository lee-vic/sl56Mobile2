import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ModifyPassword } from 'src/app/interfaces/modify-password';
import { NavController, ToastController } from '@ionic/angular';
import { UserService } from 'src/app/providers/user.service';

@Component({
  selector: 'app-modify-deliverypassword',
  templateUrl: './modify-deliverypassword.page.html',
  styleUrls: ['./modify-deliverypassword.page.scss']
})
export class ModifyDeliverypasswordPage implements OnInit {

  ngOnInit(): void {
  }

  public myForm: FormGroup;
  data:ModifyPassword;
  validation_messages={
    "password":[
      {type:"required",message:"原有交货密码不能为空"}
    ],
    "newPassword1":[
      {type:"required",message:"新交货密码不能为空"},
      {type:"pattern",message:"长度为6位并且是数字"}
    ],
    "newPassword2":[
      {type:"required",message:"新交货密码不能为空"},
      {type:"pattern",message:"长度为6位并且是数字"}
    ]
  }
  constructor(public navCtrl: NavController, 
    public formBuilder: FormBuilder,
    private service:UserService,
    public toastCtrl: ToastController,
    ) {
    this.myForm = this.formBuilder.group({
      password: ['', Validators.required],
      newPassword1: ['',Validators.compose([
        Validators.required,
        Validators.pattern("[0-9]{6}$")])],
      newPassword2: ['',Validators.compose([
        Validators.required,
        Validators.pattern("[0-9]{6}$")])],
    });
    this.data=new ModifyPassword();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ModifyDeliverypasswordPage');
  }
  doNext(formValue) {
    console.log(formValue);
    this.data.NewPassword1=formValue.newPassword1;
    this.data.NewPassword2=formValue.newPassword2;
    this.data.Password=formValue.password;
    this.service.changeDeliveryPassword(this.data).subscribe(res=>{
      console.log(res);
      if(res.Success){
        let toast = this.toastCtrl.create({
          message: "交货密码修改成功",
          position: 'middle',
          duration: 1000
        }).then(p=>p.present());
       
        
        setTimeout(() => {
          this.navCtrl.pop();
        }, 1000);
      }
      else{
        let toast = this.toastCtrl.create({
          message: res.ErrMsg,
          position: 'middle',
          duration: 3000
        }).then(p=>p.present());
     
      }
    });
  }
}
