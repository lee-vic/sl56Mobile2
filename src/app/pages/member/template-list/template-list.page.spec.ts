import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { of, throwError } from 'rxjs';
import { TemplateService } from 'src/app/providers/template.service';
import { UiFeedbackService } from 'src/app/providers/ui-feedback.service';

import { TemplateListPage } from './template-list.page';

describe('TemplateListPage', () => {
  let component: TemplateListPage;
  let fixture: ComponentFixture<TemplateListPage>;
  let getListSpy: jasmine.Spy;
  let presentToastSpy: jasmine.Spy;

  beforeEach(async(() => {
    getListSpy = jasmine.createSpy('getList').and.returnValue(of([]));
    presentToastSpy = jasmine.createSpy('presentToast').and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: TemplateService, useValue: { getList: getListSpy } },
        { provide: UiFeedbackService, useValue: { presentToast: presentToastSpy } },
        { provide: NavController, useValue: {} }
      ],
      declarations: [TemplateListPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplateListPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should load templates and append download url', () => {
    getListSpy.and.returnValue(of([{ Id: 3, Name: '预报模板', Remark: 'Excel', Url: '' }]));

    fixture.detectChanges();

    expect(component.items.length).toBe(1);
    expect(component.items[0].Url).toContain('/Template/Download/3');
    expect(component.isLoaded).toBe(true);
  });

  it('should show empty state when no templates exist', () => {
    getListSpy.and.returnValue(of([]));

    fixture.detectChanges();

    expect(component.items).toEqual([]);
    expect(component.isLoaded).toBe(true);
    expect(component.loadError).toBe(false);
  });

  it('should mark load error when request fails', () => {
    getListSpy.and.returnValue(throwError(() => new Error('network')));

    fixture.detectChanges();

    expect(component.loadError).toBe(true);
    expect(presentToastSpy).toHaveBeenCalledWith('模板列表加载失败，请稍后重试', 2200, 'middle', undefined, 'danger');
  });
});
