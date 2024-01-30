import { Component, HostListener, OnInit } from "@angular/core";
import { ProblemService } from "src/app/providers/problem.service";
import {
  AlertController,
  LoadingController,
  NavController,
} from "@ionic/angular";
import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import {
  ProblemProcessResultModel,
  ProblemProcessType2ItemResultModel,
} from "src/app/interfaces/problem";
import { CommonService } from "src/app/providers/common.service";

declare var wx: any;
@Component({
  selector: "app-problem-detail",
  templateUrl: "./problem-detail.page.html",
  styleUrls: ["./problem-detail.page.scss"],
})
export class ProblemDetailPage implements OnInit {
  receiveGoodsDetailId: Number;
  problemId: Number;
  data: any;
  processType: string;
  checkListValue: Array<boolean>;
  submitFailMessage: string;
  fileFailMessage: string;
  confirmFailMessage: string;
  processModel: ProblemProcessResultModel;
  isFileProcessing: boolean = false;
  isSubmiting: boolean = false;
  isFileRequired = true;
  isWeAppUploadFile = false;
  ngOnInit(): void {
    this.service.getProblemDetail(this.problemId).subscribe((res) => {
      this.data = res;
      console.log("data:", this.data);
      this.processModel = this.data.ProcessResult;
      console.log("model", this.processModel);
      if (this.data.Problem.Pages.length > 0)
        this.processType = this.data.Problem.Pages[0].Item1;
      this.checkListValue = new Array();
      for (let i = 0; i < this.data.Problem.ProcessSetting4.length; i++) {
        this.checkListValue.push(false);
      }
      let types: Array<number> = this.data.Problem.ProcessTypeList;
      let inputTypes = types.filter((p) => p >= 1 && p <= 4);
      console.log("inputTypes", inputTypes);
      //存在发票以及其他填写资料项时，发票不是必须
      this.isFileRequired = !(
        inputTypes.length > 1 && inputTypes.indexOf(3) != -1
      );
      console.log("isRequiredFile:", this.isFileRequired);
      this.getWeAppFileStatus(true);
      let that = this;
      //生成跳转到小程序的按钮
      if (
        wx != null &&
        inputTypes.indexOf(3) != -1
      ) {
        this.commonService
          .getJsSdkConfig(
            "https://mobile.sl56.com" + this.router.url,
            null,
            "wx-open-launch-weapp"
          )
          .subscribe((res) => {
            let config = JSON.parse(res);
            wx.config(config);
            console.log("openLaunchWeAppConfig:", config);
            const openAppDiv = document.getElementById(
              "wxOpenLaunchWeApp"
            ) as Element;
            openAppDiv.innerHTML =
              '<wx-open-launch-weapp id="launch-btn" appid="wx7e62e243bc29cc8a" path="pages/select-wechat-record-file/index?rgdProblemId=' +
              this.problemId +
              '"><template><style>.btn { padding: 5px;font-size:11px }</style><button class="btn">选择聊天文件</button></template></wx-open-launch-weapp>';

            const weOpenLaunchWeappBtn = document.getElementById(
              "launch-btn"
            ) as Element;
            console.log(weOpenLaunchWeappBtn);
            weOpenLaunchWeappBtn.addEventListener("click", function () {
              that.alertCtrl
                .create({
                  header: "提示",
                  message: "点击确定进行下一步操作",
                  buttons: [
                    {
                      text: "确定",
                      handler: () => {
                        that.getWeAppFileStatus(false);
                      },
                    },
                  ],
                })
                .then((p) => p.present());
            });
          });
      }
    });
  }

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    public service: ProblemService,
    private router: Router,
    private commonService: CommonService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.problemId = this.route.snapshot.queryParams.problemid;
    this.receiveGoodsDetailId = new Number(
      this.route.snapshot.paramMap.get("id")
    );
    this.route.queryParams.subscribe((_res) => {
      if (this.router.getCurrentNavigation().extras.state) {
        var data = this.router.getCurrentNavigation().extras.state;
        console.log(data);
        if (data.confirmFile == false) {
          //如果是微信小程序上传的文件，则需要删除
          if (data.isWeAppFile) {
            this.service
              .deleteProblemTempFile(this.problemId)
              .subscribe((p) => console.log(p));
            this.isWeAppUploadFile = false;
          } else {
            console.log("重选选择发票文件");
            let fileInputs: any = document.getElementsByName("type3Result");
            fileInputs[0].value = null;
            fileInputs[1].value = null;
          }
        }
      }
    });
    //this.receiveGoodsDetailId=navParams.get("id");
    //this.problemId=navParams.get("problemId");
    console.log(this.receiveGoodsDetailId);
  }

  chat() {
    let params: NavigationExtras = {
      state: {
        receiveGoodsDetailId: this.data.Id,
        problemId: this.data.Problem.ObjectId,
        attachmentTypeId: this.data.Problem.AttachmentTypeId,
      },
      replaceUrl: true,
    };

    this.router.navigate(["/member/chat/1"], params);
  }

  processTypeChanged(event) {
    this.processType = event.detail.value;
    const openAppDiv = document.getElementById("wxOpenLaunchWeApp") as Element;
    openAppDiv.innerHTML =
      '<wx-open-launch-weapp id="launch-btn" appid="wx7e62e243bc29cc8a" path="pages/select-wechat-record-file/index?rgdProblemId=' +
      this.problemId +
      '"><template><style>.btn { padding: 5px }</style><button class="btn">选择聊天文件</button></template></wx-open-launch-weapp>';
    console.log("选项卡Changed");
  }

  checkChange(_form) {}

  checkProcessSetting4() {}

  returnGoods() {
    let params = {
      ids: this.data.Id,
      type: 0,
    };
    this.router.navigate(["/member/return-apply"], { queryParams: params });
  }

  confirm() {
    this.service.confirm(this.processModel.Id).subscribe((res) => {
      if (!res.IsSuccess) {
        this.confirmFailMessage = res.Message;
      } else {
        this.data.Problem.Status = 1;
      }
    });
  }
  changeFile(event, form) {
    let file = null;
    if (event.target.firstChild.files.length > 0) {
      file = event.target.firstChild.files[0];
    }
    if (file != null) {
      console.log("file select");
      let fileReader = new FileReader();
      fileReader.addEventListener("load", (res) => {
        //文件名
        let fileName = file.name;
        //base64字符串
        let fileString = (res.target as FileReader).result.toString();
        this.processModel.Type3Result.FileName = file.name;
        this.processModel.Type3Result.Value = fileString;
        //发票，预览处理
        if (this.processModel.Type3Result.AttachmentTypeId == "1") {
          console.log("uploadFile start");
          this.isFileProcessing = true;
          this.service
            .invoicePretreatment(this.processModel)
            .subscribe((res) => {
              this.isFileProcessing = false;
              if (res.Result == true) {
                console.log("filePath:", res.Path);
                this.fileFailMessage = null;
                this.navCtrl.navigateForward("/member/invoice-preview", {
                  queryParams: {
                    filePath: res.Path,
                    rgdId: this.receiveGoodsDetailId,
                    problemId: this.problemId,
                    isWeAppFile: false,
                  },
                });
              } else {
                console.log("fileFailMessage:", this.fileFailMessage);
                this.fileFailMessage = res.Message;
                let fileInputs: any = document.getElementsByName("type3Result");
                fileInputs[0].value = null;
                // fileInputs[1].value=null;
              }
            });
        }
        console.log(this.processModel.Type3Result);
      });
      fileReader.readAsDataURL(file);
    } else {
      this.processModel.Type3Result.FileName = null;
      this.processModel.Type3Result.Value = null;
      console.log("file clean");
    }
  }
  submit(formGroup) {
    this.isSubmiting = true;
    let formValues = formGroup.form.value;
    //存在单选
    if (this.data.Problem.ProcessTypeList.indexOf(1) != -1) {
      this.processModel.Type1Result.Value = formValues["type1Result"];
    }
    //存在填写内容
    if (this.data.Problem.ProcessTypeList.indexOf(2) != -1) {
      this.processModel.Type2Result.Items = new Array();
      this.data.Problem.ProcessSetting2.forEach((element, index) => {
        let item: ProblemProcessType2ItemResultModel =
          new ProblemProcessType2ItemResultModel();
        item.Name = element.Item1;
        item.Value = formValues["type2Result" + index];
        this.processModel.Type2Result.Items.push(item);
      });
    }
    //存在上传文件
    if (this.data.Problem.ProcessTypeList.indexOf(3) != -1) {
    }
    //存在多选
    if (this.data.Problem.ProcessTypeList.indexOf(4) != -1) {
      this.checkListValue.forEach((element, index) => {
        if (element) {
          let checkValue = this.data.Problem.ProcessSetting4[index].Item1;
          this.processModel.Type4Result.Values.push(checkValue);
        }
      });
    }
    console.log("submitModel:", this.processModel);
    this.service.complete(this.processModel).subscribe((res) => {
      this.isSubmiting = false;
      if (res.Result == false) {
        this.submitFailMessage = res.Message;
      } else {
        this.data.Problem.Status = 1;
      }
    });
  }
  getWeAppFileStatus(isInitPage) {
    this.loadingCtrl
      .create({
        message: "获取附件状态...",
      })
      .then((p) => {
        p.present();
        this.service.isWeAppUploadFile(this.problemId).subscribe((res) => {
          this.isWeAppUploadFile = res;
          this.loadingCtrl.dismiss();
          if (isInitPage) return;
          if (res) {
            if (this.processModel.Type3Result.AttachmentTypeId == "1") {
              this.isFileProcessing = true;
              this.loadingCtrl
                .create({
                  message: "获取附件预览...",
                })
                .then((p) => p.present());
              this.service
                .invoicePretreatment(this.processModel)
                .subscribe((res) => {
                  this.isFileProcessing = false;
                  this.loadingCtrl.dismiss();
                  if (res.Result == true) {
                    console.log("filePath:", res.Path);
                    this.fileFailMessage = null;
                    this.navCtrl.navigateForward("/member/invoice-preview", {
                      queryParams: {
                        filePath: res.Path,
                        rgdId: this.receiveGoodsDetailId,
                        problemId: this.problemId,
                        isWeAppFile: true,
                      },
                    });
                  } else {
                    console.log("fileFailMessage:", this.fileFailMessage);
                    this.fileFailMessage = res.Message;
                    this.isWeAppUploadFile = false;
                  }
                });
            }
          } else {
            alert("未检测到有上传的文件，请重新上传后再试");
          }
        });
      });
  }
}
