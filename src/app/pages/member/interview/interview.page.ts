import { Component, OnInit } from '@angular/core';
import { InterviewService } from 'src/app/providers/interview.service';
import { ActivatedRoute } from '@angular/router';
import { Interview } from 'src/app/interfaces/interview';
import { LoadingController, ToastController } from "@ionic/angular";

@Component({
  selector: "app-interview",
  templateUrl: "./interview.page.html",
  styleUrls: ["./interview.page.scss"],
})
export class InterviewPage implements OnInit {
  constructor(
    private interViewService: InterviewService,
    private activateRoute: ActivatedRoute,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  scanMessage: string = "";
  isTimeExpire: boolean = false;
  pageStatus: number = -1; //页面状态：-1.初始状态  0.二维码过期  1.二维码扫码成功  2.完成面访提交
  isGetCodeEnable: boolean = true;
  getCodeSeconds: number = 60;
  interviewData: Interview = new Interview();
  verificationCode: string;
  isSubmiting: boolean = false;
  getCodeTimeout;
  rates = [
    [1, "非常不满意"],
    [2, "不满意"],
    [3, "一般"],
    [4, "满意"],
    [5, "非常满意"],
  ];
  rateTags = [
    "物流专家",
    "讲解清晰",
    "服务热情",
    "及时响应",
    "诚心贴心",
    "靠谱负责",
    "仪表整洁",
  ];
  selectedTags: Array<string> = [];
  ngOnInit(): void {
    let id = this.activateRoute.snapshot.queryParams["InterviewQRCodeId"];
    if (id == null) {
      this.pageStatus = -1;
      return;
    }
    this.interViewService.scanQRCode(id).subscribe((res) => {
      this.interviewData.InterviewQRCodeId = id;
      console.log(res);
      if (!res.Success) {
        this.pageStatus = 0;
        this.scanMessage = res.Message;
      } else {
        this.pageStatus = 1;
        this.interviewData.InterviewQRCodeId = id;
      }
    }, (err) => { 
      console.log(err);
      this.scanMessage = "扫码异常，请重试";
      this.pageStatus = 0;
    });
    //经纬度暂时设置为0
    this.interviewData.Latitude = 0;
    this.interviewData.Longitude = 0;
  }
  //选择性别
  selectGender(gender) {
    this.interviewData.Gender = gender;
    console.log(this.interviewData);
  }
  //点击评分星星
  rateStar(rate) {
    this.interviewData.Stars = rate;
    console.log(this.rates[this.interviewData.Stars - 1]);
  }
  //选择tag
  selectTag(tag) {
    let tagIndex = this.selectedTags.indexOf(tag);
    if (tagIndex != -1) {
      this.selectedTags.splice(tagIndex, 1);
    } else {
      this.selectedTags.push(tag);
    }
    this.interviewData.Tags = this.selectedTags.toString();
    console.log(this.interviewData);
  }
  //获取验证码
  getVerificationCode() {
    if (this.interviewData.InterviewQRCodeId == null) {
      this.showToast("操作异常，请重新扫码");
      return;
    }
    let reg = /^1[3|4|5|6|7|8|9][0-9]{9}$/;
    if (!reg.test(this.interviewData.Phone)) {
      this.showToast("请输入正确的手机号码");
      return;
    }
    this.interViewService
      .getVerificationCode(
        this.interviewData.InterviewQRCodeId,
        this.interviewData.Phone
      )
      .subscribe(
        (res) => {
          // console.log(res);
          if (res.Success) {
            this.verificationCode = res.Code;
            this.isGetCodeEnable = false;
            this.setCodeCountDown(this);
          } else {
            this.showToast("操作失败，请重试");
          }
        },
        (res) => {
          this.showToast(res.error.Message + "：" + res.error.ExceptionMessage);
          this.isSubmiting = false;
        }
      );
  }
  //设置获取验证码按钮倒计时
  setCodeCountDown(page) {
    page.getCodeSeconds = page.getCodeSeconds - 1;
    if (page.getCodeSeconds == 0) {
      page.isGetCodeEnable = true;
      page.getCodeSeconds = 60;
      clearTimeout(page.getCodeTimeout);
    } else {
      page.getCodeTimeout = setTimeout(page.setCodeCountDown, 1000, page);
    }
  }
  //提交
  submit() {
    if (
      this.interviewData.PersonName == null ||
      this.interviewData.PersonName.trim().length == 0
    ) {
      this.showToast("请输入姓名");
      return;
    }
    if (this.interviewData.Gender == null) {
      this.showToast("请选择性别");
      return;
    }
    if (this.interviewData.VerificationCode == null) {
      this.showToast("请输入验证码");
      return;
    }
    if (this.interviewData.VerificationCode != this.verificationCode) {
      this.showToast("验证码不正确");
      return;
    }
    this.loadingCtrl
      .create({
        message: "请稍后...",
      })
      .then((p) => p.present());
    this.isSubmiting = true;
    this.interViewService.saveInterview(this.interviewData).subscribe((res) => {
      console.log(res);
      if (res.Success) {
        this.showToast("感谢您对本次面访进行评价");
        this.pageStatus = 2;
        this.loadingCtrl.dismiss();
      }
      else {
        this.loadingCtrl.dismiss();
        this.showToast(res.Message);
        this.isSubmiting = false;
      }
    },
      (res) => { 
        this.loadingCtrl.dismiss();
        this.showToast(res.error.Message +"："+ res.error.ExceptionMessage);
        this.isSubmiting = false;
      });
  }

  showToast(message) {
    this.toastCtrl
      .create({
        message: message,
        position: "middle",
        duration: 3000,
      })
      .then((p) => p.present());
  }
}
