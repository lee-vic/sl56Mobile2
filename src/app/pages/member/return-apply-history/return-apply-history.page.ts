import { Component, OnDestroy, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ReturnHistoryContact } from 'src/app/interfaces/return';
import { ReturnService } from 'src/app/providers/return.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-return-apply-history',
  templateUrl: './return-apply-history.page.html',
  styleUrls: ['./return-apply-history.page.scss'],
})
export class ReturnApplyHistoryPage implements OnInit, OnDestroy {
  readonly skeletonRows = [1, 2, 3, 4];

  items: ReturnHistoryContact[] = [];
  filteredItems: ReturnHistoryContact[] = [];
  currentItem = '';
  searchKeyword = '';
  isLoading = false;
  isLoaded = false;
  hasLoadError = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    public modalController: ModalController,
    public service: ReturnService
  ) {}

  get selectedContact(): ReturnHistoryContact | undefined {
    return this.items.find(item => item.raw === this.currentItem);
  }

  get showSkeleton(): boolean {
    return this.isLoading && !this.isLoaded;
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.isLoaded = false;
    this.hasLoadError = false;
    this.service.applyHistory()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.isLoaded = true;
        })
      )
      .subscribe({
        next: (res) => {
          this.items = (res || []).map(item => this.parseContact(item));
          this.applyFilter();
        },
        error: () => {
          this.items = [];
          this.filteredItems = [];
          this.hasLoadError = true;
        }
      });
  }

  onSearchInput(event: CustomEvent): void {
    this.searchKeyword = (((event.detail as { value?: string | null }).value) || '').trim();
    this.applyFilter();
  }

  clearSearch(): void {
    this.searchKeyword = '';
    this.applyFilter();
  }

  onSelectionChange(event: CustomEvent): void {
    this.currentItem = ((event.detail as { value?: string }).value) || '';
  }

  chooseContact(item: ReturnHistoryContact): void {
    this.currentItem = item.raw;
  }

  select(): void {
    const contact = this.selectedContact;
    if (!contact) {
      return;
    }
    this.modalController.dismiss({
      val: contact.raw,
      personName: contact.personName,
      mobilePhone: contact.mobilePhone
    });
  }

  close(): void {
    this.modalController.dismiss();
  }

  private applyFilter(): void {
    const keyword = this.searchKeyword.toLowerCase();
    if (!keyword) {
      this.filteredItems = [...this.items];
      return;
    }
    this.filteredItems = this.items.filter(item => this.contactMatchesKeyword(item, keyword));
  }

  private contactMatchesKeyword(item: ReturnHistoryContact, keyword: string): boolean {
    return item.raw.toLowerCase().includes(keyword) ||
      item.personName.toLowerCase().includes(keyword) ||
      item.mobilePhone.includes(keyword);
  }

  private parseContact(raw: string): ReturnHistoryContact {
    const value = (raw || '').trim();
    const parts = value.split(/\s+/).filter(part => part.length > 0);
    return {
      raw: value,
      personName: parts[0] || '',
      mobilePhone: parts[1] || ''
    };
  }
}
