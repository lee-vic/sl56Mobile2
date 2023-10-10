import { Component, NgZone, OnInit } from "@angular/core";
import { InterviewService } from "src/app/providers/interview.service";
import { ActivatedRoute, Router } from "@angular/router";
import { Interview } from "src/app/interfaces/interview";
import { LoadingController, ToastController } from "@ionic/angular";
declare var wx: any;
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
    private loadingCtrl: LoadingController,
    private router: Router,
    private nz:NgZone
  ) {}

  // wx: any;
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
    let page = this;
    this.interViewService
      .config("https://mobile.sl56.com" + this.router.url, "getLocation")
      .subscribe(
        (res) => {
          console.log(res);
          // wx.config({
          //   debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          //   appId: "", // 必填，公众号的唯一标识
          //   timestamp: "", // 必填，生成签名的时间戳
          //   nonceStr: "", // 必填，生成签名的随机串
          //   signature: "", // 必填，签名
          //   jsApiList: ["getLocation"], // 必填，需要使用的JS接口列表
          // });
          let config = JSON.parse(res);
          //微信jssdk调用前先进行配置
          wx.config(config);
          //配置成功后再调用js api
          wx.ready(() => {
            wx.getLocation({
              type: "wgs84", // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
              success: function (res) {
                var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
                var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
                // var speed = res.speed; // 速度，以米/每秒计
                // var accuracy = res.accuracy; // 位置精度
                console.log("locationInfo:", res);
                let id =
                  page.activateRoute.snapshot.queryParams["InterviewQRCodeId"];
                if (id == null) {
                  page.pageStatus = -1;
                  return;
                }
                page.interViewService.scanQRCode(id).subscribe(
                  (res) => {
                    page.interviewData.InterviewQRCodeId = id;
                    console.log(res);
                    if (!res.Success) {
                      page.callBackUpdatePageInfo(0, res.Message);
                    } else {
                      page.callBackUpdatePageInfo(1, null);
                      page.interviewData.InterviewQRCodeId = id;
                    }
                  },
                  (err) => {
                    console.log(err);
                    page.callBackUpdatePageInfo(0, "扫码异常，请重试");
                  }
                );
                page.interviewData.Latitude = latitude;
                page.interviewData.Longitude = longitude;
              },
              fail: function (err) {
                console.log("getLocationInfoFail:", err);
                page.callBackUpdatePageInfo(0, "获取位置信息失败，请重试");
              },
              cancel: function (cancel) {
                console.log("拒绝获取定位：" + cancel);
                //用户拒绝获取位置信息请求
                page.callBackUpdatePageInfo(0, "获取位置信息失败，请重试");
              }
            });
          });
        },
        (err) => {
          console.log(err);
          page.callBackUpdatePageInfo(0, "扫码异常，请重试");
        },
      );
  }

  //微信jssdk回调更新页面信息时，需要手动显式触发更新
  callBackUpdatePageInfo(pageStatus,scanMessage) {
    this.nz.run(() => {
      this.scanMessage = scanMessage;
      this.pageStatus = pageStatus;
    });
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
    this.interViewService.saveInterview(this.interviewData).subscribe(
      (res) => {
        console.log(res);
        if (res.Success) {
          this.showToast("感谢您对本次面访进行评价");
          this.pageStatus = 2;
          this.loadingCtrl.dismiss();
        } else {
          this.loadingCtrl.dismiss();
          this.showToast(res.Message);
          this.isSubmiting = false;
        }
      },
      (res) => {
        this.loadingCtrl.dismiss();
        this.showToast(res.error.Message + "：" + res.error.ExceptionMessage);
        this.isSubmiting = false;
      }
    );
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
