import { Routes } from '@angular/router';

import { DashboardLayoutComponent } from './layouts/super-admin-layout/dashboard-layout/dashboard-layout.component';

import { DashboardComponent } from './features/super-admin/dashboard/dashboard.component';

import {
  DashboardEmpresaComponent
} from './features/super-admin/empresas/dashboard-empresa/dashboard-empresa.component';

import { ListarEmpresasComponent } from './features/super-admin/empresas/listar-empresas/listar-empresas.component';
import { CrearEmpresaComponent } from './features/super-admin/empresas/crear-empresa/crear-empresa.component';
import { EditarEmpresaComponent } from './features/super-admin/empresas/editar-empresa/editar-empresa.component';
import { DetalleEmpresaComponent } from './features/super-admin/empresas/detalle-empresa/detalle-empresa.component';

import {
  CrearUsuarioEmpresaComponent
} from './features/super-admin/empresas/usuarios/crear-usuario-empresa/crear-usuario-empresa.component';

import {
  EditarPasswordAdminComponent
} from './features/super-admin/empresas/editar-password-admin/editar-password-admin.component';

import {
  CrearSucursalEmpresaComponent
} from './features/super-admin/empresas/sucursales/crear-sucursal-empresa/crear-sucursal-empresa.component';

import {
  DetalleSucursalEmpresaComponent
} from './features/super-admin/empresas/sucursales/detalle-sucursal-empresa/detalle-sucursal-empresa.component';

import {
  EditarSucursalEmpresaComponent
} from './features/super-admin/empresas/sucursales/editar-sucursal-empresa/editar-sucursal-empresa.component';

import {
  CrearUsuarioSucursalComponent
} from './features/super-admin/empresas/sucursales/usuarios/crear-usuario-sucursal/crear-usuario-sucursal.component';

import {
  PanelProductosEmpresaComponent
} from './features/super-admin/empresas/productos/panel-productos-empresa/panel-productos-empresa.component';

import {
  CrearProductoComponent
} from './features/super-admin/empresas/productos/crear-producto/crear-producto.component';

import {
  PanelDetalleProductoComponent
} from './features/super-admin/empresas/productos/detalles/panel-detalle-producto/panel-detalle-producto.component';

import {
  InventarioSucursalComponent
} from './features/super-admin/empresas/sucursales/inventario/inventario-sucursal/inventario-sucursal.component';

import {
  IngresarInventarioComponent
} from './features/super-admin/empresas/sucursales/inventario/ingresar-inventario/ingresar-inventario.component';

import {
  AjustarInventarioComponent
} from './features/super-admin/empresas/sucursales/inventario/ajustar-inventario/ajustar-inventario.component';

import {
  ResumenInventarioComponent
} from './features/super-admin/empresas/sucursales/inventario/resumen-inventario/resumen-inventario.component';

import {
  MovimientosInventarioComponent
} from './features/super-admin/empresas/sucursales/inventario/movimientos-inventario/movimientos-inventario.component';

import {
  PanelInventarioSucursalComponent
} from './features/super-admin/empresas/sucursales/inventario/panel-inventario-sucursal/panel-inventario-sucursal.component';

import {
  PanelVentasSucursalComponent
} from './features/super-admin/empresas/sucursales/ventas/panel-ventas-sucursal/panel-ventas-sucursal.component';

import {
  GenerarVentaComponent
} from './features/super-admin/empresas/sucursales/ventas/generar-venta/generar-venta.component';

import {
  ConsultarFacturaComponent
} from './features/super-admin/empresas/sucursales/ventas/consultar-factura/consultar-factura.component';

import {
  DevolucionVentaComponent
} from './features/super-admin/empresas/sucursales/ventas/devolucion-venta/devolucion-venta.component';

import {
  InformeVentasComponent
} from './features/super-admin/empresas/sucursales/ventas/informe-ventas/informe-ventas.component';

import {
  PanelClientesSucursalComponent
} from './features/super-admin/empresas/sucursales/clientes/panel-clientes-sucursal/panel-clientes-sucursal.component';

import {
  CrearClienteComponent
} from './features/super-admin/empresas/sucursales/clientes/crear-cliente/crear-cliente.component';

import {
  EditarClienteComponent
} from './features/super-admin/empresas/sucursales/clientes/editar-cliente/editar-cliente.component';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'super-admin/dashboard',
    pathMatch: 'full'
  },

  // ==========================
  // EMPLEADO
  // ==========================

  {
    path: 'empleado/sucursal/:sucursalId/dashboard',
    loadComponent: () =>
      import('./features/empleado/dashboard/dashboard.component')
        .then(m => m.DashboardComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/ventas/panel',
    loadComponent: () =>
      import('./features/empleado/ventas/panel-ventas-empleado/panel-ventas-empleado.component')
        .then(m => m.PanelVentasEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/ventas/generar',
    loadComponent: () =>
      import('./features/empleado/ventas/ventas-empleado/ventas-empleado.component')
        .then(m => m.VentasEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/ventas/facturas',
    loadComponent: () =>
      import('./features/empleado/ventas/facturas-empleado/facturas-empleado.component')
        .then(m => m.FacturasEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/ventas/devolucion',
    loadComponent: () =>
      import('./features/empleado/ventas/devolucion-venta-empleado/devolucion-venta-empleado.component')
        .then(m => m.DevolucionVentaEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/ventas/historico',
    loadComponent: () =>
      import('./features/empleado/ventas/historico-ventas-empleado/historico-ventas-empleado.component')
        .then(m => m.HistoricoVentasEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/inventario/panel',
    loadComponent: () =>
      import('./features/empleado/inventario/panel-inventario-empleado/panel-inventario-empleado.component')
        .then(m => m.PanelInventarioEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/inventario/actual',
    loadComponent: () =>
      import('./features/empleado/inventario/inventario-actual-empleado/inventario-actual-empleado.component')
        .then(m => m.InventarioActualEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/inventario/movimientos',
    loadComponent: () =>
      import('./features/empleado/inventario/movimientos-inventario-empleado/movimientos-inventario-empleado.component')
        .then(m => m.MovimientosInventarioEmpleadoComponent)
  },

  {
    path: 'empleado/sucursal/:sucursalId/clientes/panel',
    loadComponent: () =>
      import('./features/empleado/clientes/panel-clientes-empleado/panel-clientes-empleado.component')
        .then(m => m.PanelClientesEmpleadoComponent)
  },

  // ==========================
  // SUPER ADMIN
  // ==========================

  {
    path: 'super-admin',
    component: DashboardLayoutComponent,
    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // ==========================
      // DASHBOARD
      // ==========================

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      // ==========================
      // EMPRESAS
      // ==========================

      {
        path: 'empresas',
        component: ListarEmpresasComponent
      },

      {
        path: 'empresas/crear',
        component: CrearEmpresaComponent
      },

      {
        path: 'empresas/editar/:id',
        component: EditarEmpresaComponent
      },

      {
        path: 'empresas/detalle/:id',
        component: DetalleEmpresaComponent
      },

      {
        path: 'empresas/:empresaId/dashboard',
        component: DashboardEmpresaComponent
      },

      // ==========================
      // USUARIOS DE EMPRESA
      // ==========================

      {
        path: 'empresas/:empresaId/usuarios/crear',
        component: CrearUsuarioEmpresaComponent
      },

      {
        path: 'empresas/:empresaId/usuarios/:usuarioId/editar-password',
        component: EditarPasswordAdminComponent
      },

      // ==========================
      // SUCURSALES DE EMPRESA
      // ==========================

      {
        path: 'empresas/:empresaId/sucursales/crear',
        component: CrearSucursalEmpresaComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/detalle/:sucursalId',
        component: DetalleSucursalEmpresaComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/editar/:sucursalId',
        component: EditarSucursalEmpresaComponent
      },

      // ==========================
      // USUARIOS DE SUCURSAL
      // ==========================

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/usuarios/crear',
        component: CrearUsuarioSucursalComponent
      },

      // ==========================
      // PRODUCTOS DE EMPRESA
      // ==========================

      {
        path: 'empresas/:empresaId/productos',
        component: PanelProductosEmpresaComponent
      },

      {
        path: 'empresas/:empresaId/productos/crear',
        component: CrearProductoComponent
      },

      {
        path: 'empresas/:empresaId/productos/detalles/:tipo',
        component: PanelDetalleProductoComponent
      },

      // ==========================
      // INVENTARIO DE SUCURSAL
      // ==========================

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario',
        component: InventarioSucursalComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/ingresar',
        component: IngresarInventarioComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/ajustar',
        component: AjustarInventarioComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/resumen',
        component: ResumenInventarioComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/movimientos',
        component: MovimientosInventarioComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/panel',
        component: PanelInventarioSucursalComponent
      },

      // ==========================
      // VENTAS DE SUCURSAL
      // ==========================

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/ventas/panel',
        component: PanelVentasSucursalComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/ventas/generar',
        component: GenerarVentaComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/ventas/consultar',
        component: ConsultarFacturaComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/ventas/devolucion',
        component: DevolucionVentaComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/ventas/informe',
        component: InformeVentasComponent
      },

      // ==========================
      // CLIENTES DE SUCURSAL
      // ==========================

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/clientes/panel',
        component: PanelClientesSucursalComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/clientes/crear',
        component: CrearClienteComponent
      },

      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/clientes/editar/:clienteId',
        component: EditarClienteComponent
      }

    ]
  },

  {
    path: '**',
    redirectTo: 'super-admin/dashboard'
  }

];
