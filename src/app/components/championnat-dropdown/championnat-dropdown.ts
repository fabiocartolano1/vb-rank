import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChampionnatOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-championnat-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championnat-dropdown.html',
  styleUrl: './championnat-dropdown.css',
})
export class ChampionnatDropdownComponent {
  @Input() championnats: ChampionnatOption[] = [];
  @Input() selectedValue: string = '';
  @Output() selectionChange = new EventEmitter<string>();

  dropdownOpen = signal(false);

  toggleDropdown() {
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  isDropdownOpen(): boolean {
    return this.dropdownOpen();
  }

  getSelectedLabel(): string {
    const selected = this.championnats.find(c => c.value === this.selectedValue);
    return selected ? selected.label : this.championnats[0]?.label || '';
  }

  onSelectChampionnat(value: string) {
    this.selectionChange.emit(value);
    this.dropdownOpen.set(false);
  }
}
