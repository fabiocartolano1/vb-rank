import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Championship } from '../../core/constants/championships.constants';

@Component({
  selector: 'app-championnat-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './championnat-dropdown.html',
  styleUrl: './championnat-dropdown.css',
})
export class ChampionnatDropdownComponent {
  @Input() championnats: readonly Championship[] = [];
  @Input() selectedId: string = '';
  @Output() selectionChange = new EventEmitter<string>();

  dropdownOpen = signal(false);

  toggleDropdown() {
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  isDropdownOpen(): boolean {
    return this.dropdownOpen();
  }

  getSelectedName(): string {
    const selected = this.championnats.find(c => c.id === this.selectedId);
    return selected ? selected.name : this.championnats[0]?.name || '';
  }

  onSelectChampionnat(id: string) {
    this.selectionChange.emit(id);
    this.dropdownOpen.set(false);
  }
}
