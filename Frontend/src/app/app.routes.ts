import { Routes } from '@angular/router';

import { roleGuard } from './core/guards/role.guard';
import { empresaAccessGuard } from './core/guards/empresa-access.guard';
import { sucursalAccessGuard } from './core/guards/sucursal-access.guard';
import { empleadoSucursalAccessGuard } from './core/guards/empleado-sucursal-access.guard';

import { DashboardLayoutComponent } from './layouts/super-admin-layout/dashboard-layout/dashboard-layout.component';

import { DashboardComponent } from './features/super-admin/dashboard/dashboard.component';

import {
  DashboardEmpresaComponent
} from './features/super-admin/empresas/dashboard-empresa/dashboard-empresa.component';

import { ListarEmpresasComponent } from './features/super-admin/empresas/listar-empresas/listar-empresas.component';
import { CrearEmpresaComponent } from './features/super-admin/empresas/crear-empresa/crear-empresa.component';
import { EditarEmpresaComponent } from './features/super-admin/empresas/editar-empresa/editar-empresa.component';
import { DetalleEmpresaComponent } from './features/super-admin/empresas/detalle-empresa/detalle-empresa.component';
import { InformesEmpresaComponent } from './features/super-admin/empresas/informes-empresa/informes-empresa.component';
import { InformeGraficoEmpresaComponent } from './features/super-admin/empresas/informes-empresa/informe-grafico-empresa.component';
import { MovimientosEmpresaComponent } from './features/super-admin/empresas/movimientos-empresa/movimientos-empresa.component';

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
  ReportesContablesComponent
} from './features/super-admin/empresas/sucursales/reportes-contables/reportes-contables.component';

import {
  EditarSucursalEmpresaComponent
} from './features/super-admin/empresas/sucursales/editar-sucursal-empresa/editar-sucursal-empresa.component';

import {
  CrearUsuarioSucursalComponent
} from './features/super-admin/empresas/sucursales/usuarios/crear-usuario-sucursal/crear-usuario-sucursal.component';

import {
  EditarUsuarioSucursalComponent
} from './features/super-admin/empresas/sucursales/usuarios/editar-usuario-sucursal/editar-usuario-sucursal.component';

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
  AtributosCostoComponent
} from './features/super-admin/empresas/productos/atributos-costo/atributos-costo.component';

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
  AjustarPrecioComponent
} from './features/super-admin/empresas/sucursales/inventario/ajustar-precio/ajustar-precio.component';

import {
  ConfigurarPorcentajesComponent
} from './features/super-admin/empresas/sucursales/inventario/configurar-porcentajes/configurar-porcentajes.component';

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

  // ==========================
  // LOGIN
  // ==========================
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // ==========================
  // ACCESO DENEGADO
  // ==========================
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import('./features/auth/acceso-denegado/acceso-denegado.component')
        .then(m => m.AccesoDenegadoComponent)
  },

  // ==========================
  // EMPLEADO
  // ==========================
  {
    path: 'empleado/sucursal/:sucursalId',
    loadComponent: () =>
      import('./layouts/empleado-layout/empleado-layout.component')
        .then(m => m.EmpleadoLayoutComponent),
    canActivate: [
      roleGuard,
      empleadoSucursalAccessGuard
    ],
    runGuardsAndResolvers: 'always',
    data: {
      roles: ['EMPLEADO']
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/empleado/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'gastos/registrar',
        loadComponent: () =>
          import('./features/empleado/contabilidad/registrar-gasto-empleado/registrar-gasto-empleado.component')
            .then(m => m.RegistrarGastoEmpleadoComponent)
      },
      {
        path: 'ventas/panel',
        loadComponent: () =>
          import('./features/empleado/ventas/panel-ventas-empleado/panel-ventas-empleado.component')
            .then(m => m.PanelVentasEmpleadoComponent)
      },
      {
        path: 'ventas/generar',
        loadComponent: () =>
          import('./features/empleado/ventas/ventas-empleado/ventas-empleado.component')
            .then(m => m.VentasEmpleadoComponent)
      },
      {
        path: 'ventas/facturas',
        loadComponent: () =>
          import('./features/empleado/ventas/facturas-empleado/facturas-empleado.component')
            .then(m => m.FacturasEmpleadoComponent)
      },
      {
        path: 'ventas/devolucion',
        loadComponent: () =>
          import('./features/empleado/ventas/devolucion-venta-empleado/devolucion-venta-empleado.component')
            .then(m => m.DevolucionVentaEmpleadoComponent)
      },
      {
        path: 'ventas/historico',
        loadComponent: () =>
          import('./features/empleado/ventas/historico-ventas-empleado/historico-ventas-empleado.component')
            .then(m => m.HistoricoVentasEmpleadoComponent)
      },
      {
        path: 'inventario/panel',
        loadComponent: () =>
          import('./features/empleado/inventario/panel-inventario-empleado/panel-inventario-empleado.component')
            .then(m => m.PanelInventarioEmpleadoComponent)
      },
      {
        path: 'inventario/actual',
        loadComponent: () =>
          import('./features/empleado/inventario/inventario-actual-empleado/inventario-actual-empleado.component')
            .then(m => m.InventarioActualEmpleadoComponent)
      },
      {
        path: 'inventario/movimientos',
        loadComponent: () =>
          import('./features/empleado/inventario/movimientos-inventario-empleado/movimientos-inventario-empleado.component')
            .then(m => m.MovimientosInventarioEmpleadoComponent)
      },
      {
        path: 'clientes/panel',
        loadComponent: () =>
          import('./features/empleado/clientes/panel-clientes-empleado/panel-clientes-empleado.component')
            .then(m => m.PanelClientesEmpleadoComponent)
      }
    ]
  },

  // ==========================
  // ADMIN
  // ==========================
  {
    path: 'admin/empresa/:empresaId',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    canActivate: [
      roleGuard,
      empresaAccessGuard
    ],
    runGuardsAndResolvers: 'always',
    data: {
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: DetalleEmpresaComponent
      },
      {
        path: 'editar',
        component: EditarEmpresaComponent
      },
      {
        path: 'dashboard/estadisticas',
        component: DashboardEmpresaComponent
      },
      {
        path: 'informes/grafico',
        component: InformeGraficoEmpresaComponent
      },
      {
        path: 'informes',
        component: InformesEmpresaComponent
      },
      {
        path: 'movimientos',
        component: MovimientosEmpresaComponent
      },

      // Usuarios de empresa
      {
        path: 'usuarios/crear',
        component: CrearUsuarioEmpresaComponent
      },
      {
        path: 'usuarios/:usuarioId/editar-password',
        component: EditarPasswordAdminComponent
      },

      // Sucursales
      {
        path: 'sucursales/crear',
        component: CrearSucursalEmpresaComponent
      },
      {
        path: 'sucursales/detalle/:sucursalId',
        component: DetalleSucursalEmpresaComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/reportes-contables',
        component: ReportesContablesComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/clasificaciones-contables',
        loadComponent: () =>
          import('./features/super-admin/empresas/sucursales/clasificaciones-contables/clasificaciones-contables.component')
            .then(m => m.ClasificacionesContablesComponent),
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/movimientos',
        component: MovimientosEmpresaComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/compras-varias',
        loadComponent: () =>
          import('./features/super-admin/empresas/sucursales/compras-varias/compras-varias.component')
            .then(m => m.ComprasVariasComponent),
        canActivate: [roleGuard, sucursalAccessGuard],
        data: {
          roles: ['SUPER_ADMIN', 'ADMIN']
        }
      },
      {
        path: 'sucursales/editar/:sucursalId',
        component: EditarSucursalEmpresaComponent,
        canActivate: [sucursalAccessGuard]
      },

      // Usuarios de sucursal
      {
        path: 'sucursales/:sucursalId/usuarios/crear',
        component: CrearUsuarioSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/usuarios/:usuarioId/editar-password',
        component: EditarUsuarioSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },

      // Productos
      {
        path: 'productos',
        component: PanelProductosEmpresaComponent
      },
      {
        path: 'productos/crear',
        component: CrearProductoComponent
      },
      {
        path: 'productos/detalles/:tipo',
        component: PanelDetalleProductoComponent
      },
      {
        path: 'productos/atributos-costo',
        component: AtributosCostoComponent
      },

      // Inventario
      {
        path: 'sucursales/:sucursalId/inventario',
        component: InventarioSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/panel',
        component: PanelInventarioSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/ingresar',
        component: IngresarInventarioComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/ajustar',
        component: AjustarInventarioComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/ajustar-precio',
        component: AjustarPrecioComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/configurar-porcentajes',
        component: ConfigurarPorcentajesComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/resumen',
        component: ResumenInventarioComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/inventario/movimientos',
        component: MovimientosInventarioComponent,
        canActivate: [sucursalAccessGuard]
      },

      // Ventas
      {
        path: 'sucursales/:sucursalId/ventas/panel',
        component: PanelVentasSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/ventas/generar',
        component: GenerarVentaComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/ventas/consultar',
        component: ConsultarFacturaComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/ventas/devolucion',
        component: DevolucionVentaComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/ventas/informe',
        component: InformeVentasComponent,
        canActivate: [sucursalAccessGuard]
      },

      // Clientes
      {
        path: 'sucursales/:sucursalId/clientes/panel',
        component: PanelClientesSucursalComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/clientes/crear',
        component: CrearClienteComponent,
        canActivate: [sucursalAccessGuard]
      },
      {
        path: 'sucursales/:sucursalId/clientes/editar/:clienteId',
        component: EditarClienteComponent,
        canActivate: [sucursalAccessGuard]
      }
    ]
  },

  // ==========================
  // SUPER ADMIN
  // ==========================
  {
    path: 'super-admin',
    component: DashboardLayoutComponent,
    canActivate: [roleGuard],
    data: {
      roles: ['SUPER_ADMIN']
    },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      // Empresas
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
      {
        path: 'empresas/:empresaId/informes/grafico',
        component: InformeGraficoEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/informes',
        component: InformesEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/movimientos',
        component: MovimientosEmpresaComponent
      },

      // Usuarios de empresa
      {
        path: 'empresas/:empresaId/usuarios/crear',
        component: CrearUsuarioEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/usuarios/:usuarioId/editar-password',
        component: EditarPasswordAdminComponent
      },

      // Sucursales
      {
        path: 'empresas/:empresaId/sucursales/crear',
        component: CrearSucursalEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/detalle/:sucursalId',
        component: DetalleSucursalEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/reportes-contables',
        component: ReportesContablesComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/clasificaciones-contables',
        loadComponent: () =>
          import('./features/super-admin/empresas/sucursales/clasificaciones-contables/clasificaciones-contables.component')
            .then(m => m.ClasificacionesContablesComponent)
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/movimientos',
        component: MovimientosEmpresaComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/compras-varias',
        loadComponent: () =>
          import('./features/super-admin/empresas/sucursales/compras-varias/compras-varias.component')
            .then(m => m.ComprasVariasComponent),
        canActivate: [roleGuard, sucursalAccessGuard],
        data: {
          roles: ['SUPER_ADMIN']
        }
      },
      {
        path: 'empresas/:empresaId/sucursales/editar/:sucursalId',
        component: EditarSucursalEmpresaComponent
      },

      // Usuarios de sucursal
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/usuarios/crear',
        component: CrearUsuarioSucursalComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/usuarios/:usuarioId/editar-password',
        component: EditarUsuarioSucursalComponent
      },

      // Productos
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
      {
        path: 'empresas/:empresaId/productos/atributos-costo',
        component: AtributosCostoComponent
      },

      // Inventario
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
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/ajustar-precio',
        component: AjustarPrecioComponent
      },
      {
        path: 'empresas/:empresaId/sucursales/:sucursalId/inventario/configurar-porcentajes',
        component: ConfigurarPorcentajesComponent
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

      // Ventas
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

      // Clientes
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

  // ==========================
  // RUTA NO ENCONTRADA
  // ==========================
  {
    path: '**',
    redirectTo: 'login'
  }
];
