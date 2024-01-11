import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonService } from 'src/app/providers/common.service';
declare var wx: any;
@Component({
  selector: "app-problem-weapp-test",
  templateUrl: "./problem-weapp-test.component.html",
  styleUrls: ["./problem-weapp-test.component.scss"],
})
export class ProblemWeappTestComponent implements OnInit {
  constructor(
    private router: Router,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
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
    const openAppDiv = document.getElementById("wxOpenLaunchWeApp") as Element;
    openAppDiv.innerHTML =
      '<wx-open-launch-weapp id="launch-btn" appid="wx7e62e243bc29cc8a" path="pages/logon/index"><template><style>.btn { padding: 12px }</style><button class="btn">打开小程序</button></template></wx-open-launch-weapp>';
      });
  }

}
