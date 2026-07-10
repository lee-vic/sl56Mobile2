import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { CompanyNameDetail, CompanyNameListItem } from 'src/app/interfaces/company-name';
import { CompanyNameService } from 'src/app/providers/company-name.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-company-name-detail',
  templateUrl: './company-name-detail.page.html',
  styleUrls: ['./company-name-detail.page.scss'],
})
export class CompanyNameDetailPage implements OnInit, OnDestroy {
  currentDetail: CompanyNameDetail | null = null;
  isLoading = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: CompanyNameService,
    private readonly uiFeedback: UiFeedbackService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (id <= 0) {
      this.router.navigateByUrl('/member/company-name');
      return;
    }
    this.loadDetail(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openEdit(item: CompanyNameListItem): void {
    this.router.navigate(['/member/company-name/form', item.ObjectId]);
  }

  getImageUrl(id: number): string {
    return this.service.getImageUrl(id);
  }

  getStatusColor(item: CompanyNameListItem | CompanyNameDetail): string {
    if (item.FilingStatus === 2) {
      return 'success';
    }
    if (item.FilingStatus === 3) {
      return 'danger';
    }
    if (item.FilingStatus === 1) {
      return 'primary';
    }
    return 'warning';
  }

  private loadDetail(id: number): void {
    this.isLoading = true;
    this.service.getDetail(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (detail) => {
          this.currentDetail = detail;
        },
        error: () => {
          this.showToast('备案详情加载失败');
          this.router.navigateByUrl('/member/company-name');
        },
      });
  }

  private async showToast(message: string): Promise<void> {
    await this.uiFeedback.presentToast(message, 1800, 'middle');
  }
}
