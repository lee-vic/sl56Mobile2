import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { of, Subject } from 'rxjs';

import { ChatPage } from './chat.page';
import { SignalR } from 'src/app/providers/signal-r.service';
import { ProblemService } from 'src/app/providers/problem.service';
import { InstantMessageService } from 'src/app/providers/instant-message.service';

describe('ChatPage', () => {
  let component: ChatPage;
  let fixture: ComponentFixture<ChatPage>;
  let messageReceived$: Subject<any>;
  let queryParams$: Subject<any>;

  const invokeSpy = jasmine.createSpy('invoke').and.returnValue(Promise.resolve('1'));
  const mockSignalRConnection = {
    status: new Subject<any>(),
    start: () => Promise.resolve({
      listenFor: (eventName: string) => eventName === 'messageReceived' ? messageReceived$ : of({})
    }),
    stop: jasmine.createSpy('stop'),
    invoke: invokeSpy,
    listenFor: () => messageReceived$
  };
  const mockSignalR = {
    createConnection: () => mockSignalRConnection
  };
  const mockRoute = {
    snapshot: {
      paramMap: {
        get: () => '99'
      }
    },
    queryParams: null
  } as any;
  const mockRouter = {
    getCurrentNavigation: () => null
  };
  const mockProblemService = {
    upload1: () => of({}),
    upload: () => of({})
  };
  const mockImService = {
    getMessages2: () => of({ Data: [], ChatGroupId: 0 }),
    getMessages3: () => of({ Data: [], ChatGroupId: 0 })
  };
  const mockToastController = {
    create: () => Promise.resolve({ present: () => Promise.resolve() })
  };

  beforeEach(async(() => {
    messageReceived$ = new Subject<any>();
    queryParams$ = new Subject<any>();
    mockRoute.queryParams = queryParams$.asObservable();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, ReactiveFormsModule, IonicModule.forRoot()],
      providers: [
        { provide: SignalR, useValue: mockSignalR },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: ProblemService, useValue: mockProblemService },
        { provide: InstantMessageService, useValue: mockImService },
        { provide: ToastController, useValue: mockToastController },
        { provide: NavController, useValue: {} },
        { provide: AlertController, useValue: {} }
      ],
      declarations: [ ChatPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatPage);
    component = fixture.componentInstance;
    component.messages = [];
    component.chatGroupId = 100;
    invokeSpy.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should ignore malformed json message without throwing', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(() => messageReceived$.next('{invalid-json')).not.toThrow();
    expect(component.messages.length).toBe(0);
    expect(invokeSpy).not.toHaveBeenCalled();
  }));

  it('should append message and mark group read on valid incoming message', fakeAsync(() => {
    component.ngOnInit();
    tick();

    messageReceived$.next({
      MsgType: 1,
      SenderName: '客服',
      MsgContent: 'hello',
      MsgFrom: 101,
      IsFile: false,
      ObjectId: 501,
      AtUserName: null,
      RefContent: null
    });

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].Content).toBe('hello');
    expect(invokeSpy).toHaveBeenCalledWith('markRead', 100);
    tick(401);
  }));

  it('should revoke an existing message when revoke event arrives', fakeAsync(() => {
    component.messages = [{ Id: 77, IsRevoke: false } as any];
    component.ngOnInit();
    tick();

    messageReceived$.next({
      MsgType: 6,
      SenderName: '客服',
      MsgContent: 77,
      ShowType: 0
    });

    expect(component.messages.length).toBe(1);
    expect(component.messages[0].IsRevoke).toBe(true);
  }));

  it('should ignore message without required fields', fakeAsync(() => {
    component.ngOnInit();
    tick();

    messageReceived$.next({ MsgContent: 'no type' });

    expect(component.messages.length).toBe(0);
    expect(invokeSpy).not.toHaveBeenCalled();
  }));
});
