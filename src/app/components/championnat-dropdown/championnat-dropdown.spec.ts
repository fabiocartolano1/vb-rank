import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChampionnatDropdown } from './championnat-dropdown';

describe('ChampionnatDropdown', () => {
  let component: ChampionnatDropdown;
  let fixture: ComponentFixture<ChampionnatDropdown>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChampionnatDropdown]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChampionnatDropdown);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
