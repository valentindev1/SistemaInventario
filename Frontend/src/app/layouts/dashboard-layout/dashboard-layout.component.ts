import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {

  sidebarCollapsed = false;
  sidebarMobileOpen = false;

  private collapseTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly desktopBreakpoint = 992;
  private readonly tiempoColapso = 5000;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!this.esNavegador()) {
      return;
    }

    this.configurarEstadoInicial();
    this.programarColapsoAutomatico();
  }

  ngOnDestroy(): void {
    this.limpiarTimer();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.esNavegador()) {
      return;
    }

    this.configurarEstadoInicial();
  }

  configurarEstadoInicial(): void {
    if (!this.esNavegador()) {
      return;
    }

    if (this.esMobile()) {
      this.sidebarCollapsed = true;
      this.sidebarMobileOpen = false;
      this.limpiarTimer();
      return;
    }

    this.sidebarMobileOpen = false;

    if (!this.sidebarCollapsed) {
      this.programarColapsoAutomatico();
    }
  }

  toggleSidebar(): void {
    if (!this.esNavegador()) {
      return;
    }

    if (this.esMobile()) {
      this.sidebarMobileOpen = !this.sidebarMobileOpen;
      return;
    }

    this.sidebarCollapsed = !this.sidebarCollapsed;

    if (!this.sidebarCollapsed) {
      this.programarColapsoAutomatico();
    } else {
      this.limpiarTimer();
    }
  }

  abrirSidebarTemporal(): void {
    if (!this.esNavegador() || this.esMobile()) {
      return;
    }

    this.limpiarTimer();
    this.sidebarCollapsed = false;
  }

  cerrarSidebarTemporal(): void {
    if (!this.esNavegador() || this.esMobile()) {
      return;
    }

    this.programarColapsoAutomatico();
  }

  cerrarSidebarMobile(): void {
    if (!this.esNavegador()) {
      return;
    }

    if (this.esMobile()) {
      this.sidebarMobileOpen = false;
    }
  }

  private programarColapsoAutomatico(): void {
    if (!this.esNavegador() || this.esMobile()) {
      return;
    }

    this.limpiarTimer();

    this.collapseTimer = setTimeout(() => {
      this.sidebarCollapsed = true;
    }, this.tiempoColapso);
  }

  private limpiarTimer(): void {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  private esMobile(): boolean {
    if (!this.esNavegador()) {
      return false;
    }

    return window.innerWidth < this.desktopBreakpoint;
  }

  private esNavegador(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
