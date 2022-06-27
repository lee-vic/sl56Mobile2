import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubAccount } from 'src/app/interfaces/sub-account';
import { DistributeService } from 'src/app/providers/distribute.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.page.html',
  styleUrls: ['./user-info.page.scss']
})
export class UserInfoPage implements OnInit {

  constructor(private formBuilder: FormBuilder, private distributeService: DistributeService, private toastCtrl: ToastController) { }

  userInfo: SubAccount;
  userInfoForm: FormGroup = this.formBuilder.group({
    ObjectName: ['', Validators.required],
    MobilePhone: ['', [Validators.required, Validators.pattern("^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\\d{8}$")]],
    IdCardNumber: ['', [Validators.required, Validators.pattern("^[1-9]\\d{5}(18|19|([23]\\d))\\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$")]],
    Email: ['', Validators.email],
    Wechat: [''],
    BankAccountHolder: ['', Validators.required],
    BankCarNumber: ['', Validators.required],
    BankName: ['', Validators.required],
    BankCardPhoneNumber: ['', [Validators.required, Validators.pattern("^1[3|4|5|6|7|8|9][0-9]{9}$")]]
  });
  validation_messages = {
    "ObjectName": [
      { type: "required", message: "姓名不能为空" }
    ],
    "MobilePhone": [
      { type: "required", message: "手机号码不能为空" },

      { type: "pattern", message: "手机号码格式不正确" }
    ],
    "IdCardNumber": [
      { type: "required", message: "身份证号码不能为空" },

      { type: "pattern", message: "身份证号码格式不正确" }
    ],
    "Email": [
      { type: "email", message: "邮箱格式不正确" }
    ],
    "BankAccountHolder": [
      { type: "required", message: "开户名不能为空" }
    ],
    "BankCarNumber": [
      { type: "required", message: "银行卡号不能为空" }
    ],
    "BankName": [
      { type: "required", message: "银行名称不能为空" }
    ],
    "BankCardPhoneNumber": [
      { type: "required", message: "银行卡绑定手机号码不能为空" },

      { type: "pattern", message: "手机号码格式不正确" }
    ]
  };
  ngOnInit(): void {
    this.userInfo = new SubAccount();
    this.distributeService.getUserInfo().subscribe(res => {
      console.log("getUserInfo:", res);
      if (res != null) {
        this.userInfoForm.setValue({
          ObjectName: res.ObjectName,
          MobilePhone: res.MobilePhone,
          IdCardNumber: res.IDCardNumber,
          Email: res.Email,
          Wechat: res.Wechat,
          BankAccountHolder: res.BankAccountHolder,
          BankCarNumber: res.BankCarNumber,
          BankName: res.BankName,
          BankCardPhoneNumber: res.BankCardPhoneNumber
        });
      }
    });
  }
  onSubmit() {
    this.userInfo.ContactName = this.userInfoForm.value.ObjectName;
    this.userInfo.MobilePhone = this.userInfoForm.value.MobilePhone;
    this.userInfo.IdCardNumber = this.userInfoForm.value.IdCardNumber;
    this.userInfo.Email = this.userInfoForm.value.Email;
    this.userInfo.Wechat = this.userInfoForm.value.Wechat;
    this.userInfo.BankAccountHolder = this.userInfoForm.value.BankAccountHolder;
    this.userInfo.BankCarNumber = this.userInfoForm.value.BankCarNumber;
    this.userInfo.BankName = this.userInfoForm.value.BankName;
    this.userInfo.BankCardPhoneNumber = this.userInfoForm.value.BankCardPhoneNumber;
    this.distributeService.updateUserInfo(this.userInfo).subscribe(res => {
      if (res.length == 0) {
        let toast = this.toastCtrl.create({
          message: "保存成功",
          position: 'middle',
          duration: 3000
        }).then(p => p.present());
      } else {
        let toast = this.toastCtrl.create({
          message: "保存失败：" + res,
          position: 'middle',
          duration: 3000
        }).then(p => p.present());
      }
    });
  }
}
