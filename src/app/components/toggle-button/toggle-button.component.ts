import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle-button.component.html',
  styleUrl: './toggle-button.component.css',
})
export class ToggleButtonComponent {
  checked = input.required<boolean>();
  label = input<string>('');

  toggleChange = output<boolean>();

  onToggle() {
    this.toggleChange.emit(!this.checked());
  }
}
