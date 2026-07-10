import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  CompanyNameListItem,
  CompanyNameQueryResult,
} from 'src/app/interfaces/company-name';
import { CompanyNameService } from 'src/app/providers/company-name.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

@Component({
  selector: 'app-company-name',
  templateUrl: './company-name.page.html',
  styleUrls: ['./company-name.page.scss'],
})
export class CompanyNamePage implements OnInit, OnDestroy {
  activeSegment: 'query' | 'list' = 'query';
  queryForm: FormGroup;
  queryResult: CompanyNameQueryResult | null = null;
  list: CompanyNameListItem[] = [];
  filteredList: CompanyNameListItem[] = [];
  keyword = '';
  statusFilter = 'all';
  isQuerying = false;
  isLoadingList = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly service: CompanyNameService,
    private readonly uiFeedback: UiFeedbackService,
    private readonly router: Router
  ) {
    this.queryForm = this.formBuilder.group({
      CompanyName: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 ]+$/)]],
    });
  }

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(): void {
    if (this.service.consumeListDirty()) {
      this.loadList();
      this.activeSegment = 'list';
    }
  }

  doQuery(): void {
    if (this.queryForm.invalid || this.isQuerying) {
      this.showToast('请输入有效的英文公司名');
      return;
    }

    const companyName = String(this.queryForm.value.CompanyName || '').trim().toUpperCase();
    this.queryForm.patchValue({ CompanyName: companyName }, { emitEvent: false });
    this.queryResult = null;
    this.isQuerying = true;

    this.service.queryGlobal({ CompanyName: companyName })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isQuerying = false;
        })
      )
      .subscribe({
        next: (res) => {
          this.queryResult = res;
          if (!res.Success) {
            this.showToast(res.Message || '查询失败');
          }
        },
        error: () => {
          this.showToast('查询失败，请稍后重试');
        },
      });
  }

  loadList(refresher?: CustomEvent): void {
    this.isLoadingList = true;
    this.service.getList()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingList = false;
          if (refresher?.target) {
            (refresher.target as HTMLIonRefresherElement).complete();
          }
        })
      )
      .subscribe({
        next: (items) => {
          this.list = Array.isArray(items) ? items : [];
          this.applyListFilter();
        },
        error: () => {
          this.showToast('备案列表加载失败，请稍后重试');
        },
      });
  }

  onRefresh(event: CustomEvent): void {
    this.loadList(event);
  }

  onSearchChange(event: CustomEvent): void {
    this.keyword = String(event.detail?.value || '');
    this.applyListFilter();
  }

  onStatusFilterChange(): void {
    this.applyListFilter();
  }

  openCreate(): void {
    this.router.navigateByUrl('/member/company-name/form');
  }

  openEdit(item: CompanyNameListItem): void {
    this.router.navigate(['/member/company-name/form', item.ObjectId]);
  }

  openDetail(item: CompanyNameListItem): void {
    this.router.navigate(['/member/company-name/detail', item.ObjectId]);
  }

  getStatusColor(item: CompanyNameListItem): string {
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

  private applyListFilter(): void {
    const keyword = this.keyword.trim().toUpperCase();
    this.filteredList = this.list.filter((item) => {
      const matchKeyword = !keyword
        || String(item.CompanyName || '').toUpperCase().indexOf(keyword) > -1
        || String(item.ChineseCompanyName || '').toUpperCase().indexOf(keyword) > -1;
      const matchStatus = this.statusFilter === 'all'
        || String(item.FilingStatus) === this.statusFilter;
      return matchKeyword && matchStatus;
    });
  }

  private async showToast(message: string): Promise<void> {
    await this.uiFeedback.presentToast(message, 1800, 'middle');
  }
}
