import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ProblemService } from "src/app/providers/problem.service";
import {
  AlertController,
  NavController,
} from "@ionic/angular";
import { ActivatedRoute, Router, NavigationExtras } from "@angular/router";
import {
  ProblemProcessResultModel,
  ProblemProcessType2ItemResultModel,
} from "src/app/interfaces/problem";
import { CommonService } from "src/app/providers/common.service";
import { NgForm } from "@angular/forms";
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

declare var wx: any;
@Component({
  selector: "app-problem-detail",
  templateUrl: "./problem-detail.page.html",
  styleUrls: ["./problem-detail.page.scss"],
})
export class ProblemDetailPage implements OnInit, OnDestroy {
  receiveGoodsDetailId: Number;
  problemId: Number;
  data: any;
  processType: string;
  processOptions: Array<{ key: string; title: string }> = [];
  private processActionMap: { [key: string]: "form" | "chat" | "return" | "confirm" } = {};
  checkListValue: Array<boolean>;
  submitFailMessage: string;
  fileFailMessage: string;
  confirmFailMessage: string;
  processModel: ProblemProcessResultModel;
  isFileProcessing: boolean = false;
  isSubmiting: boolean = false;
  isLoading = false;
  hasInitError = false;
  isFileRequired = true;
  isWeAppUploadFile = false;
  @ViewChild('page1Form') formRef: NgForm;
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadProblemDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryInit(): void {
    this.loadProblemDetail();
  }

  private loadProblemDetail(): void {
    this.isLoading = true;
    this.hasInitError = false;
    this.service.getProblemDetail(this.problemId).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe((res) => {
      this.data = res || { Problem: { ProcessTypeList: [], ProcessSetting4: [], Pages: [] }, ProcessResult: {} };
      this.processModel = this.data.ProcessResult;
      this.ensureProcessModel();

      const setting4 = this.data?.Problem?.ProcessSetting4 || [];
      this.checkListValue = [];
      for (let i = 0; i < setting4.length; i++) {
        this.checkListValue.push(false);
      }

      let types: Array<number> = (this.data?.Problem?.ProcessTypeList || []);
      let inputTypes = types.filter((p) => p >= 1 && p <= 4);
      //存在发票以及其他填写资料项时，发票不是必须
      this.isFileRequired = !(
        inputTypes.length > 1 && inputTypes.indexOf(3) !== -1
      );

      this.buildOptions();
      this.getWeAppFileStatus(true);
      this.renderWeAppButtonIfNeeded();
    }, _ => {
      this.hasInitError = true;
    });
  }

  private ensureProcessModel(): void {
    if (!this.processModel) {
      this.processModel = {} as ProblemProcessResultModel;
    }
    if (!this.processModel.Type1Result) {
      this.processModel.Type1Result = { Value: null } as any;
    }
    if (!this.processModel.Type2Result) {
      this.processModel.Type2Result = { Items: [] } as any;
    }
    if (!this.processModel.Type3Result) {
      this.processModel.Type3Result = { Value: null, AttachmentTypeId: "", FileName: null } as any;
    }
    if (!this.processModel.Type4Result) {
      this.processModel.Type4Result = { Values: [] } as any;
    } else if (!this.processModel.Type4Result.Values) {
      this.processModel.Type4Result.Values = [];
    }
  }

  private buildOptions(): void {
    const pages = this.data?.Problem?.Pages || [];
    const mapByKey: { [key: string]: { title: string; action: "form" | "chat" | "return" | "confirm" } } = {
      Page1: { title: "更新信息", action: "form" },
      Page2: { title: "更改渠道", action: "chat" },
      Page3: { title: "退件处理", action: "return" },
      Page4: { title: "直接确认", action: "confirm" },
    };

    this.processOptions = pages.map((page) => {
      const key = page.Item1;
      const preset = mapByKey[key] || { title: page.Item2 || key, action: "chat" as const };
      this.processActionMap[key] = preset.action;
      return {
        key,
        title: page.Item2 || preset.title,
      };
    });

    if (this.processOptions.length > 0) {
      this.processType = this.processOptions[0].key;
    }
  }

  get isProblemDone(): boolean {
    return this.data?.Problem?.Status === 1;
  }

  get hasSelfService(): boolean {
    return this.data?.Problem?.Status === 0 && this.processOptions.length > 0;
  }

  hasProcessType(type: number): boolean {
    return (this.data?.Problem?.ProcessTypeList || []).indexOf(type) !== -1;
  }

  getCurrentAction(): "form" | "chat" | "return" | "confirm" {
    return this.processActionMap[this.processType] || "chat";
  }

  isFormOption(): boolean {
    return this.getCurrentAction() === "form";
  }

  canSubmit(form: NgForm): boolean {
    if (this.isSubmiting || this.isFileProcessing) {
      return false;
    }
    if (this.hasProcessType(4) && this.checkListValue.length > 0 && this.checkListValue.indexOf(true) === -1) {
      return false;
    }
    return (form?.valid || this.isWeAppUploadFile) === true;
  }

  private renderWeAppButtonIfNeeded(): void {
    const openAppDiv = document.getElementById("wxOpenLaunchWeApp") as Element;
    if (!openAppDiv) {
      return;
    }
    if (!this.isFormOption() || !this.hasProcessType(3) || wx == null) {
      openAppDiv.innerHTML = "";
      return;
    }

    this.commonService
      .getJsSdkConfig(
        "https://mobile.sl56.com" + this.router.url,
        null,
        "wx-open-launch-weapp"
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        let config = JSON.parse(res);
        wx.config(config);
        openAppDiv.innerHTML =
          '<wx-open-launch-weapp id="launch-btn" appid="wx7e62e243bc29cc8a" path="pages/select-wechat-record-file/index?rgdProblemId=' +
          this.problemId +
          '"><template><style>.btn { padding: 6px 10px;font-size:12px;border-radius:8px;background:#0b61bd;color:#fff;border:0; }</style><button class="btn">打开微信小程序上传</button></template></wx-open-launch-weapp>';

        const weOpenLaunchWeappBtn = document.getElementById("launch-btn") as Element;
        if (!weOpenLaunchWeappBtn) {
          return;
        }
        weOpenLaunchWeappBtn.addEventListener("click", () => {
          this.alertCtrl
            .create({
              header: "上传提示",
              message: "上传完成后请返回当前页面继续处理。",
              buttons: [
                {
                  text: "我已完成上传",
                  handler: () => {
                    this.getWeAppFileStatus(false);
                  },
                },
              ],
            })
            .then((p) => p.present());
        });
      });
  }

  constructor(
    public navCtrl: NavController,
    private route: ActivatedRoute,
    public service: ProblemService,
    private router: Router,
    private commonService: CommonService,
    private alertCtrl: AlertController,
  ) {
    this.problemId = this.route.snapshot.queryParams.problemid;
    this.receiveGoodsDetailId = new Number(
      this.route.snapshot.paramMap.get("id")
    );
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((_res) => {
      const nav = this.router.getCurrentNavigation();
      const data = (nav && nav.extras && nav.extras.state) || window.history.state;
      if (data && (data.confirmFile != undefined || data.isWeAppFile != undefined)) {
        if (data.confirmFile === false) {
          //如果是微信小程序上传的文件，则需要删除
          if (data.isWeAppFile) {
            this.service
              .deleteProblemTempFile(this.problemId)
              .pipe(takeUntil(this.destroy$))
              .subscribe();
            this.isWeAppUploadFile = false;
          } else {
            let fileInputs: any = document.getElementsByName("type3Result");
            if (fileInputs.length > 0) {
              fileInputs[0].value = null;
            }
          }
        }
      }
    });
  }

  chat() {
    let params: NavigationExtras = {
      state: {
        receiveGoodsDetailId: this.data.Id,
        problemId: this.data.Problem.ObjectId,
        attachmentTypeId: this.data.Problem.AttachmentTypeId,
      },
    };

    this.router.navigate(["/member/chat/1"], params);
  }

  processTypeChanged(event) {
    this.processType = event?.detail?.value;
    this.submitFailMessage = null;
    this.confirmFailMessage = null;
    this.renderWeAppButtonIfNeeded();
  }

  checkProcessSetting4(): void {
    this.submitFailMessage = null;
  }

  returnGoods() {
    let params = {
      ids: this.data.Id,
      type: 0,
    };
    this.router.navigate(["/member/return-apply"], { queryParams: params });
  }

  confirm() {
    this.service.confirm(this.processModel.Id).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      if (!res.IsSuccess) {
        this.confirmFailMessage = res.Message;
      } else {
        this.data.Problem.Status = 1;
      }
    });
  }

  triggerFormSubmit(): void {
    if (this.formRef) {
      this.submit(this.formRef);
    }
  }
  changeFile(event, form) {
    let file = null;
    const target = event?.target as HTMLInputElement | null;
    if (target?.files && target.files.length > 0) {
      file = target.files[0];
    } else if (target?.firstChild && (target.firstChild as any).files?.length > 0) {
      // Keep compatibility for existing event mocks that still provide firstChild.files.
      file = (target.firstChild as any).files[0];
    }
    if (file != null) {
      let fileReader = new FileReader();
      fileReader.addEventListener("load", (res) => {
        //文件名
        //base64字符串
        let fileString = (res.target as FileReader).result.toString();
        this.processModel.Type3Result.FileName = file.name;
        this.processModel.Type3Result.Value = fileString;
        //发票，预览处理
        if (this.processModel.Type3Result.AttachmentTypeId == "1") {
          this.isFileProcessing = true;
          this.service
            .invoicePretreatment(this.processModel)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              this.isFileProcessing = false;
              if (res.Result === true) {
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
                this.fileFailMessage = res.Message;
                let fileInputs: any = document.getElementsByName("type3Result");
                fileInputs[0].value = null;
                // fileInputs[1].value=null;
              }
            });
        }
      });
      fileReader.readAsDataURL(file);
    } else {
      this.processModel.Type3Result.FileName = null;
      this.processModel.Type3Result.Value = null;
    }
  }
  submit(formGroup) {
    if (!this.isFormOption()) {
      return;
    }
    this.isSubmiting = true;
    this.submitFailMessage = null;
    let formValues = formGroup.form.value;
    //存在单选
    if (this.hasProcessType(1)) {
      this.processModel.Type1Result.Value = formValues["type1Result"];
    }
    //存在填写内容
    if (this.hasProcessType(2)) {
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
    if (this.data.Problem.ProcessTypeList.indexOf(3) !== -1) {
    }
    //存在多选
    if (this.hasProcessType(4)) {
      this.processModel.Type4Result.Values = [];
      this.checkListValue.forEach((element, index) => {
        if (element) {
          let checkValue = this.data.Problem.ProcessSetting4[index].Item1;
          this.processModel.Type4Result.Values.push(checkValue);
        }
      });
    }
    this.service.complete(this.processModel).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.isSubmiting = false;
      if (res.Result === false) {
        this.submitFailMessage = res.Message;
      } else {
        this.data.Problem.Status = 1;
      }
    }, _ => {
      this.isSubmiting = false;
      this.submitFailMessage = '提交失败，请稍后重试';
    });
  }

  getWeAppFileStatus(isInitPage) {
    this.service.isWeAppUploadFile(this.problemId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.isWeAppUploadFile = res;
      if (isInitPage) return;
      if (res) {
        if (this.processModel.Type3Result.AttachmentTypeId === "1") {
          this.isFileProcessing = true;
          this.service
            .invoicePretreatment(this.processModel)
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
              this.isFileProcessing = false;
              if (res.Result === true) {
                this.navCtrl.navigateForward("/member/invoice-preview", {
                      queryParams: {
                        filePath: res.Path,
                        rgdId: this.receiveGoodsDetailId,
                        problemId: this.problemId,
                        isWeAppFile: true,
                      },
                    });
                  } else {
                    this.fileFailMessage = res.Message;
                    this.isWeAppUploadFile = false;
                  }
                }, _ => {
                  this.isFileProcessing = false;
                  this.fileFailMessage = '获取附件预览失败，请稍后重试';
                });
            }
          } else {
            this.alertCtrl
              .create({
                header: "未检测到文件",
                message: "请先在微信小程序中完成上传，然后返回本页刷新状态。",
                buttons: ["我知道了"],
              })
              .then((x) => x.present());
          }
        }, _ => {
          this.alertCtrl
            .create({
              header: '获取失败',
              message: '当前无法获取附件状态，请稍后重试。',
              buttons: ['我知道了'],
            })
            .then((x) => x.present());
        });
  }
}
