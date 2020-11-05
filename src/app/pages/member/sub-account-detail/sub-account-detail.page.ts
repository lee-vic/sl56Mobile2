import { Component, OnInit } from '@angular/core';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { SubAccountService } from 'src/app/providers/sub-account.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sub-account-detail',
  templateUrl: './sub-account-detail.page.html',
  styleUrls: ['./sub-account-detail.page.scss'],
})
export class SubAccountDetailPage implements OnInit {

  id: any;
  data: SubAccount = new SubAccount();
  title: string;
  isNew: boolean;
  public myForm: FormGroup;
  constructor(public navCtrl: NavController,
    private service: SubAccountService,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    private route: ActivatedRoute,
    public formBuilder: FormBuilder,
    ) {
      this.id = +this.route.snapshot.paramMap.get('id');
   
    console.log(this.id);
    if (this.id == 0) {
      this.title = "新增子帐号";
      this.isNew = true;
    }
    else {
      this.title = "编辑子帐号";
      this.isNew = false;
    }
    this.myForm = this.formBuilder.group({
      mobilephone: ['', Validators.compose([
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11)
      ])],
      contactname: [{value:''}, Validators.compose([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(32)
      ])],
        //赋值绕过表单验证
      password: ['1234abcd', Validators.compose([
        Validators.required,
        Validators.pattern("^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$")])],
      password1: ['', Validators.compose([
        Validators.pattern("^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{8,16}$")])],
      discount: ['', Validators.compose([
        Validators.required,
        Validators.min(0.01),
        Validators.max(10)
      ])],
    });
  }
  validation_messages={
    "mobilephone":[
      {type:"required",message:"手机号码必须输入"},
      {type:"minlength",message:"手机号码必须为11位"},
      {type:"maxlength",message:"手机号码必须为11位"}
    ],
    "contactname":[
      {type:"required",message:"姓名必须输入"},
      {type:"minlength",message:"姓名至少为2位"},
      {type:"maxlength",message:"姓名不能超过32位"},
    ],
    "password":[
      {type:"required",message:"登录密码不能为空"},
      {type:"pattern",message:"长度为8-16位并且是字母和数字的组合"}
    ],
    "newPassword1":[
      {type:"pattern",message:"长度为8-16位并且是字母和数字的组合"}
    ],
    "discount":[
      {type:"required",message:"折扣必须输入"},
      {type:"min",message:"折扣不能小于0.01"},
      {type:"max",message:"折扣不能大于10"}
    ]
   
  }
  ngOnInit(): void {
    if (this.id != 0) {
      this.service.detail(this.id).subscribe(res => {
        
        this.data = res;
      });
    }

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EditSubAccountPage');
  }
  onSubmit(formValue) {
    console.log(this.data);
    if (this.isNew) {
      this.service.create(this.data).subscribe(res => {
        if (res.Success) {
          this.navCtrl.pop();
        }
        else {
          let toast = this.toastCtrl.create({
            message: res.ErrMsg,
            position: 'middle',
            duration: 3000
          }).then(p=>p.present());
          
        }

      });
    }
    else {
      this.service.edit(this.data).subscribe(res => {
        if (res.Success) {
          this.navCtrl.pop();
        }
        else {
          let toast = this.toastCtrl.create({
            message: res.ErrMsg,
            position: 'middle',
            duration: 3000
          }).then(p=>p.present());
          
        }

      });
      
    }
  }
  delete() {

    let confirm = this.alertCtrl.create({
      header: '确定删除?',
      buttons: [
        {
          text: '取消',
        },
        {
          text: '确定',
          handler: () => {
            this.service.delete(this.id).subscribe(res => {
              this.navCtrl.pop();
            });
          }
        }
      ]
    }).then(p=>p.present());
  
  }
}
