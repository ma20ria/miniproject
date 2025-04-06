import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NavbarComponent } from '../../../ui/navbar/navbar.component';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss']
})
export class ProfileViewComponent implements OnInit {
  currentUser: User | null = null;
  isLoading = true;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isLoading = false;
  }
} 