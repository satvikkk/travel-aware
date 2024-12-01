import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopCrimesComponent } from './top-crimes.component';

describe('TopCrimesComponent', () => {
  let component: TopCrimesComponent;
  let fixture: ComponentFixture<TopCrimesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopCrimesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopCrimesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
