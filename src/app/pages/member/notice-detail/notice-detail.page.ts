import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Notice } from 'src/app/interfaces/notice';
import { NoticeService } from 'src/app/providers/notice.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-notice-detail',
  templateUrl: './notice-detail.page.html',
  styleUrls: ['./notice-detail.page.scss'],
})
export class NoticeDetailPage implements OnInit {
  id: number;
  notice: Notice;
  isLoading = false;
  isLoaded = false;
  loadError = false;

  ngOnInit(): void {
    this.loadDetail();
  }

  constructor(
    private readonly service: NoticeService,
    private readonly route: ActivatedRoute,
    private readonly uiFeedbackService: UiFeedbackService
  ) {
    this.id = +this.route.snapshot.paramMap.get('id');
  }

  loadDetail(): void {
    this.isLoading = true;
    this.loadError = false;

    this.service.getDetail(this.id).pipe(
      finalize(() => {
        this.isLoading = false;
        this.isLoaded = true;
      })
    ).subscribe({
      next: res => {
        this.notice = res;
      },
      error: () => {
        this.notice = null;
        this.loadError = true;
        this.uiFeedbackService.presentToast('公告详情加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
      }
    });
  }
}
