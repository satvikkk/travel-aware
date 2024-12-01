import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-top-crimes',
  template: `
    <mat-card *ngIf="crimes.length > 0" class="mt-4">
      <mat-card-header>
        <mat-card-title class="text-lg">Top Crimes in Your Demographic</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list role="list">
          @for (crime of crimes; track crime) {
            <mat-list-item role="listitem" class="flex items-center">
              <mat-icon class="mr-2 text-red-500">warning</mat-icon>
              <span class="font-medium">{{crime[0]}}</span>
              <span class="ml-2 text-gray-600">({{crime[1]}} incidents)</span>
            </mat-list-item>
          }
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule]
})
export class TopCrimesComponent {
  @Input() crimes: [string, number][] = [];
}