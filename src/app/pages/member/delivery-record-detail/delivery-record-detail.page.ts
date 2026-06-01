import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { DeliveryRecordDetailService } from "src/app/providers/delivery-record-detail.service";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import {
  NavController,
  ActionSheetController,
  AlertController,
  IonContent,
  ToastController,
} from "@ionic/angular";
import { ProblemService } from "src/app/providers/problem.service";
import { apiUrl } from "src/app/global";
@Component({
  selector: "app-delivery-record-detail",
  templateUrl: "./delivery-record-detail.page.html",
  styleUrls: ["./delivery-record-detail.page.scss"],
})
export class DeliveryRecordDetailPage implements OnInit, AfterViewInit {
  @ViewChild("detailContent", { static: false }) detailContent?: IonContent;

  data: any;
  id: any;
  tab = "1";
  problemFilter: "all" | "processing" | "done" = "all";
  isReturn = true;
  canGoBack: boolean = true;
  private readonly sectionIds = ["1", "2", "3", "4", "5"];
  private readonly filterStorageKey = "delivery-record-detail:problem-filter";
  private isSyncingTab = false;
  constructor(
    public navCtrl: NavController,
    private router: Router,
    public service: DeliveryRecordDetailService,
    public problemService: ProblemService,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public actionSheetController: ActionSheetController,
    private route: ActivatedRoute
  ) {
    //公众号
    this.route.queryParams.subscribe((p) => {
      if (p && p.push) {
        if (p.push === "true") {
          this.canGoBack = false;
        }
      }

      if (p && p.section && ["1", "2", "3", "4", "5"].includes(p.section)) {
        this.tab = p.section;
      }
    });
  }

  ngOnInit() {
    this.id = +this.route.snapshot.paramMap.get("id");
    this.restoreProblemFilter();

    //不能返回的视为站外链接
    this.service.getDetail(!this.canGoBack, this.id).subscribe(
      (res) => {
        this.data = res;
        if (this.data.IsShowPackageTracks) {
          this.data.PackageTracks = this.parsePackageTracks(
            this.data.PackageTracksJsonString
          );
          this.data.PackageTracks.forEach((element) => {
            element.open = false;
          });
        }
        this.isReturn = this.data.IsReturnCustomer;
        //如果允许下载标签且有标签则生成下载地址
          if(this.data.AllowDownloadLabel && this.data.HasLabel){
           this.data.LabelUrl =apiUrl+ "/DeliveryRecord/DownloadLabel/"+this.data.TransportDocumentId;
        }
        else{
          this.data.LabelUrl = null;
        }

        setTimeout(() => {
          if (this.tab !== "1") {
            this.scrollToSection(this.tab, false);
          }
        }, 0);

      },
      (err) => {
        //  let toast = this.toastCtrl.create({
        //    message: err.message,
        //    position: 'middle',
        //    duration: 2000
        //  });
        //  toast.present();
      }
    );
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.tab !== "1") {
        this.scrollToSection(this.tab, false);
      }
    }, 0);
  }

  private parsePackageTracks(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw !== 'string' || raw.trim() === '') return [];

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  applyReturn() {
    this.navigateToReturnApply();
  }
  chat() {
    let extras: NavigationExtras = {
      state: {
        receiveGoodsDetailId: this.data.ObjectId,
        messages: this.data.ChatRecords,
      },
    };
    this.router.navigate(["/member/chat/1"], extras);
  }
  more() {
    this.presentActionSheet();
  }
  async presentActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: "请选择",
      buttons: [
        {
          text: "我要退货",
          handler: () => {
            this.navigateToReturnApply();
          },
        },
        {
          text: "我要暂扣",
          handler: () => {
            this.alertCtrl
              .create({
                header: "确定要暂扣吗",
                message:
                  "货物暂扣后，将暂停所有操作流程，由于此操作造成的时效问题，一律由客户自身承担",
                buttons: [
                  {
                    text: "取消",
                    handler: () => {},
                  },
                  {
                    text: "确定",
                    handler: () => {
                      this.problemService
                        .addProblem(this.id)
                        .subscribe((res) => {
                          if (res.Success === false) {
                            this.toastCtrl
                              .create({
                                message: res.Message,
                                position: "middle",
                                duration: 2000,
                              })
                              .then((p) => p.present());
                          } else {
                            this.toastCtrl
                              .create({
                                message: "已成功扣件",
                                position: "middle",
                                duration: 2000,
                              })
                              .then((p) => p.present());
                          }
                        });
                    },
                  },
                ],
              })
              .then((p) => p.present());
          },
        },
        {
          text: "取消",
          role: "cancel",
          handler: () => {},
        },
      ],
    });
    await actionSheet.present();
  }

  onSegmentChanged(event: CustomEvent) {
    const value = (event?.detail as any)?.value;
    if (!value || !this.sectionIds.includes(value)) {
      return;
    }
    this.jumpToSection(value);
  }

  jumpToSection(section: string) {
    if (!section || !this.sectionIds.includes(section)) {
      return;
    }
    this.tab = section;
    this.triggerHapticFeedback();
    this.scrollToSection(section, true);
  }

  onContentScroll(event: CustomEvent) {
    if (this.isSyncingTab) {
      return;
    }

    const scrollTop = (event?.detail as any)?.scrollTop || 0;
    let active = "1";

    for (const sectionId of this.sectionIds) {
      const el = document.getElementById(`section-${sectionId}`);
      if (el && scrollTop + 170 >= el.offsetTop) {
        active = sectionId;
      }
    }

    if (active !== this.tab) {
      this.tab = active;
    }
  }

  private async scrollToSection(section: string, animate: boolean) {
    const target = document.getElementById(`section-${section}`);
    if (!this.detailContent || !target) {
      return;
    }

    this.isSyncingTab = true;
    const scrollTop = Math.max(target.offsetTop - 112, 0);
    await this.detailContent.scrollToPoint(0, scrollTop, animate ? 280 : 0);
    setTimeout(() => {
      this.isSyncingTab = false;
    }, animate ? 320 : 80);
  }

  trackToggle(packageTrackItem) {
    this.data.PackageTracks.forEach((element) => {
      if (element.PackageId === packageTrackItem.PackageId) {
        element.open = !element.open;
      } else {
        element.open = false;
      }
    });
  }

  get hasLabel(): boolean {
    return !!this.data?.LabelUrl;
  }

  get sizesCount(): number {
    return this.data?.Sizes?.length || 0;
  }

  get tracksCount(): number {
    if (this.data?.IsShowPackageTracks) {
      return this.data?.PackageTracks?.length || 0;
    }
    return this.data?.Tracks?.length || 0;
  }

  get receivableCount(): number {
    return this.data?.AccountReceivableDetails?.length || 0;
  }

  get problemCount(): number {
    return this.data?.Problems?.length || 0;
  }

  formatCurrency(amount: any): string {
    const value = parseFloat((amount ?? 0).toString());
    if (isNaN(value)) {
      return "￥0.00";
    }
    return `￥${value.toFixed(2)}`;
  }

  displayValue(value: any): string {
    if (value === null || value === undefined || value === "") {
      return "--";
    }
    return value.toString();
  }

  setProblemFilter(filter: "all" | "processing" | "done") {
    this.problemFilter = filter;
    this.persistProblemFilter();
  }

  get filteredProblems(): any[] {
    const problems = this.data?.Problems || [];
    if (this.problemFilter === "all") {
      return problems;
    }
    return problems.filter((item) => this.problemCategory(item?.StatusName) === this.problemFilter);
  }

  get processingProblemCount(): number {
    return (this.data?.Problems || []).filter((item) => this.problemCategory(item?.StatusName) === "processing").length;
  }

  get doneProblemCount(): number {
    return (this.data?.Problems || []).filter((item) => this.problemCategory(item?.StatusName) === "done").length;
  }

  async copyTrackText(value: any, label: string) {
    const text = this.displayValue(value);
    if (text === "--") {
      this.toastCtrl
        .create({
          message: `暂无可复制${label}`,
          position: "middle",
          duration: 1200,
        })
        .then((p) => p.present());
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.toastCtrl
        .create({
          message: `${label}已复制`,
          position: "middle",
          duration: 1200,
          color: "success",
        })
        .then((p) => p.present());
    } catch {
      this.toastCtrl
        .create({
          message: "当前环境不支持复制",
          position: "middle",
          duration: 1200,
        })
        .then((p) => p.present());
    }
  }

  copyTrackSummary(time: any, location: any, activity: any) {
    const summary = [
      `时间: ${this.displayValue(time)}`,
      `地点: ${this.displayValue(location)}`,
      `事件: ${this.displayValue(activity)}`,
    ].join(" | ");
    this.copyTrackText(summary, "轨迹");
  }

  problemStatusColor(statusName: any): string {
    const category = this.problemCategory(statusName);
    if (category === "done") {
      return "success";
    }
    if (category === "processing") {
      return "warning";
    }
    return "medium";
  }

  private problemCategory(statusName: any): "processing" | "done" | "other" {
    const text = (statusName || "").toString();
    if (text.includes("已完成") || text.includes("已处理") || text.includes("关闭")) {
      return "done";
    }
    if (text.includes("处理中") || text.includes("跟进") || text.includes("待处理")) {
      return "processing";
    }
    if (text.includes("异常") || text.includes("拒绝") || text.includes("失败") || text.includes("驳回")) {
      return "other";
    }
    return "other";
  }

  private navigateToReturnApply(): void {
    this.navCtrl.navigateForward("/member/return-apply", {
      queryParams: { type: 0, ids: this.data.ObjectId },
    });
  }

  private persistProblemFilter() {
    try {
      localStorage.setItem(this.filterStorageKey, this.problemFilter);
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }

  private restoreProblemFilter() {
    try {
      const stored = localStorage.getItem(this.filterStorageKey);
      if (stored && ["all", "processing", "done"].includes(stored)) {
        this.problemFilter = stored as "all" | "processing" | "done";
      }
    } catch {
      // Ignore storage failures in restricted environments.
    }
  }

  private triggerHapticFeedback() {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  }
}
