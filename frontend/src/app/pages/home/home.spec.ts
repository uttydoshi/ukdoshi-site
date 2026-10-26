import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('greets visitors by name and shows About me underneath', () => {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('h1')?.textContent).toContain("Hi, I'm Utty");
    expect(root.textContent).toContain('Utkarsh Doshi');
    expect(root.querySelector('app-about')?.textContent).toContain('Me at work');
  });
});
