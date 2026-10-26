import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Status } from './status';

describe('Status', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Status],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
  });

  it('should render Hello World', () => {
    const fixture = TestBed.createComponent(Status);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello World');
  });

  it('should show the message from the API', async () => {
    const fixture = TestBed.createComponent(Status);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/hello').flush({ message: 'Hello World' });
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.api')?.textContent).toContain('From the Python API: Hello World');
  });
});
