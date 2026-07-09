import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { VentaService } from '../../../../../../core/services/venta/venta.service';

import {
  InformeConsolidadoVentasDTO,
  ResumenVentasDiaDTO
} from '../../../../../../core/models/venta/venta.model';

type TipoFiltroInforme = 'DIA' | 'MES' | 'RANGO';

@Component({
  selector: 'app-informe-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './informe-ventas.component.html',
  styleUrl: './informe-ventas.component.css'
})
export class InformeVentasComponent implements OnInit {

  empresaId!: number;
  sucursalId!: number;

  tipoFiltro: TipoFiltroInforme = 'DIA';

  fechaDia = '';
  fechaMes = '';
  fechaInicio = '';
  fechaFin = '';

  informe: InformeConsolidadoVentasDTO | null = null;

  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ventaService: VentaService
  ) {}

  ngOnInit(): void {
    const empresaIdParam = this.route.snapshot.paramMap.get('empresaId');
    const sucursalIdParam = this.route.snapshot.paramMap.get('sucursalId');

    if (!empresaIdParam || !sucursalIdParam) {
      this.mensajeError = 'No se pudo identificar la empresa o la sucursal.';
      return;
    }

    this.empresaId = Number(empresaIdParam);
    this.sucursalId = Number(sucursalIdParam);

    if (!this.empresaId || !this.sucursalId) {
      this.mensajeError = 'Los identificadores de empresa o sucursal no son válidos.';
      return;
    }

    this.inicializarFechas();
    this.generarInforme();
  }

  inicializarFechas(): void {
    const hoy = new Date();

    this.fechaDia = this.formatearFecha(hoy);

    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');

    this.fechaMes = `${year}-${month}`;

    const primerDiaMes = new Date(year, hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(year, hoy.getMonth() + 1, 0);

    this.fechaInicio = this.formatearFecha(primerDiaMes);
    this.fechaFin = this.formatearFecha(ultimoDiaMes);
  }

  cambiarTipoFiltro(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const hoy = new Date();

    if (this.tipoFiltro === 'DIA') {
      this.fechaDia = this.formatearFecha(hoy);
    }

    if (this.tipoFiltro === 'MES') {
      const year = hoy.getFullYear();
      const month = String(hoy.getMonth() + 1).padStart(2, '0');
      this.fechaMes = `${year}-${month}`;
    }

    if (this.tipoFiltro === 'RANGO') {
      const year = hoy.getFullYear();
      const month = hoy.getMonth();

      const primerDiaMes = new Date(year, month, 1);
      const ultimoDiaMes = new Date(year, month + 1, 0);

      this.fechaInicio = this.formatearFecha(primerDiaMes);
      this.fechaFin = this.formatearFecha(ultimoDiaMes);
    }
  }

  generarInforme(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    const rango = this.obtenerRangoFechas();

    if (!rango) {
      return;
    }

    if (!this.validarRangoFechas(rango.fechaInicio, rango.fechaFin)) {
      return;
    }

    this.cargando = true;

    this.ventaService.generarInformeConsolidado(
      this.sucursalId,
      rango.fechaInicio,
      rango.fechaFin
    ).subscribe({
      next: (data) => {
        this.informe = data;
        this.cargando = false;
        this.mensajeExito = 'Informe generado correctamente.';
      },
      error: (error) => {
        this.cargando = false;
        this.informe = null;
        this.mensajeError = this.obtenerMensajeError(error);
        console.error(error);
      }
    });
  }

  obtenerRangoFechas(): { fechaInicio: string; fechaFin: string } | null {
    if (this.tipoFiltro === 'DIA') {
      if (!this.fechaDia) {
        this.mensajeError = 'Debe seleccionar un día.';
        return null;
      }

      return {
        fechaInicio: this.fechaDia,
        fechaFin: this.fechaDia
      };
    }

    if (this.tipoFiltro === 'MES') {
      if (!this.fechaMes) {
        this.mensajeError = 'Debe seleccionar un mes.';
        return null;
      }

      const [yearTexto, monthTexto] = this.fechaMes.split('-');

      const year = Number(yearTexto);
      const month = Number(monthTexto) - 1;

      const inicio = new Date(year, month, 1);
      const fin = new Date(year, month + 1, 0);

      return {
        fechaInicio: this.formatearFecha(inicio),
        fechaFin: this.formatearFecha(fin)
      };
    }

    if (!this.fechaInicio || !this.fechaFin) {
      this.mensajeError = 'Debe seleccionar fecha inicial y fecha final.';
      return null;
    }

    return {
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };
  }

  validarRangoFechas(fechaInicio: string, fechaFin: string): boolean {
    const inicio = new Date(`${fechaInicio}T00:00:00`);
    const fin = new Date(`${fechaFin}T00:00:00`);

    if (fin < inicio) {
      this.mensajeError = 'La fecha final no puede ser menor que la fecha inicial.';
      return false;
    }

    const fechaMaxima = new Date(inicio);
    fechaMaxima.setMonth(fechaMaxima.getMonth() + 12);

    if (fin > fechaMaxima) {
      this.mensajeError = 'El rango personalizado no puede superar 12 meses.';
      return false;
    }

    return true;
  }

  volverAlPanel(): void {
    this.router.navigate([
      '/super-admin/empresas',
      this.empresaId,
      'sucursales',
      this.sucursalId,
      'ventas',
      'panel'
    ]);
  }



  async descargarExcel(): Promise<void> {
    if (!this.informe) {
      this.mensajeError = 'Primero debes generar un informe para descargarlo.';
      return;
    }

    const XLSX = await import('xlsx');

    const informe = this.informe;

    const libro = XLSX.utils.book_new();

    const hojaResumen = XLSX.utils.aoa_to_sheet([
      ['Informe consolidado de ventas'],
      ['Sucursal', informe.sucursalNombre],
      ['Fecha inicial', informe.fechaInicio],
      ['Fecha final', informe.fechaFin],
      [],
      ['Resumen financiero'],
      ['Ventas brutas', informe.ventasBrutas],
      ['Descuentos aplicados', informe.descuentos],
      ['Ventas netas', informe.ventasNetas],
      ['Costo vendido', informe.costoVendido],
      ['Utilidad bruta', informe.utilidadBruta],
      ['Costo ajustes negativos', informe.costoAjustesNegativos],
      ['Resultado operativo estimado', informe.resultadoOperativoEstimado],
      [],
      ['Márgenes'],
      ['Margen utilidad bruta', `${this.calcularMargenUtilidad().toFixed(2)}%`],
      ['Margen operativo', `${this.calcularMargenOperativo().toFixed(2)}%`]
    ]);

    hojaResumen['!cols'] = [
      { wch: 32 },
      { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hojaResumen,
      'Resumen'
    );

    const hojaFacturacion = XLSX.utils.aoa_to_sheet([
      ['Estado de facturación'],
      ['Facturas emitidas', informe.facturasEmitidas],
      ['Facturas activas', informe.facturasActivas],
      ['Facturas canceladas', informe.facturasCanceladas],
      ['Facturas con devolución parcial', informe.facturasDevueltasParcial],
      ['Facturas con devolución total', informe.facturasDevueltasTotal],
      ['Valor cancelado', informe.valorCancelado],
      ['Valor devuelto', informe.valorDevuelto],
      ['Productos vendidos netos', informe.productosVendidos],
      ['Productos devueltos', informe.productosDevueltos]
    ]);

    hojaFacturacion['!cols'] = [
      { wch: 36 },
      { wch: 22 }
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hojaFacturacion,
      'Facturacion'
    );

    const hojaInventario = XLSX.utils.aoa_to_sheet([
      ['Inventario disponible actual'],
      ['Unidades disponibles', informe.unidadesInventarioActual],
      ['Costo inventario actual', informe.costoInventarioActual],
      ['Valor comercial inventario actual', informe.valorComercialInventarioActual],
      ['Utilidad proyectada inventario', informe.utilidadProyectadaInventario]
    ]);

    hojaInventario['!cols'] = [
      { wch: 38 },
      { wch: 24 }
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hojaInventario,
      'Inventario actual'
    );

    const ventasPorDia = informe.ventasPorDia.map(dia => ({
      Fecha: dia.fecha,
      Facturas: dia.facturas,
      'Productos vendidos': dia.productosVendidos,
      'Ventas brutas': dia.ventasBrutas,
      Descuentos: dia.descuentos,
      'Ventas netas': dia.ventasNetas,
      'Costo vendido': dia.costoVendido,
      Utilidad: dia.utilidad
    }));

    const hojaDias = XLSX.utils.json_to_sheet(ventasPorDia);

    hojaDias['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(
      libro,
      hojaDias,
      'Ventas por dia'
    );

    XLSX.writeFile(
      libro,
      this.generarNombreArchivo('informe-ventas', 'xlsx')
    );
  }

  async descargarPdf(): Promise<void> {
    if (!this.informe) {
      this.mensajeError = 'Primero debes generar un informe para descargarlo.';
      return;
    }

    const jsPdfModule = await import('jspdf');
    const autoTableModule = await import('jspdf-autotable');

    const jsPDF = jsPdfModule.default;
    const autoTable = autoTableModule.default;

    const informe = this.informe;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Informe consolidado de ventas',
      pageWidth / 2,
      14,
      { align: 'center' }
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Sucursal: ${informe.sucursalNombre}`,
      14,
      24
    );

    doc.text(
      `Periodo: ${informe.fechaInicio} a ${informe.fechaFin}`,
      14,
      30
    );

    doc.text(
      `Generado: ${new Date().toLocaleString('es-CO')}`,
      14,
      36
    );

    autoTable(doc, {
      startY: 44,
      head: [['Resumen financiero', 'Valor']],
      body: [
        ['Ventas brutas', this.formatearMoneda(informe.ventasBrutas)],
        ['Descuentos aplicados', this.formatearMoneda(informe.descuentos)],
        ['Ventas netas', this.formatearMoneda(informe.ventasNetas)],
        ['Costo vendido', this.formatearMoneda(informe.costoVendido)],
        ['Utilidad bruta', this.formatearMoneda(informe.utilidadBruta)],
        ['Ajustes negativos', this.formatearMoneda(informe.costoAjustesNegativos)],
        ['Resultado operativo estimado', this.formatearMoneda(informe.resultadoOperativoEstimado)],
        ['Margen utilidad bruta', `${this.calcularMargenUtilidad().toFixed(2)}%`],
        ['Margen operativo', `${this.calcularMargenOperativo().toFixed(2)}%`]
      ],
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: [13, 110, 253]
      }
    });

    let siguienteY = (doc as any).lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: siguienteY,
      head: [['Estado de facturación', 'Cantidad / Valor']],
      body: [
        ['Facturas emitidas', informe.facturasEmitidas],
        ['Facturas activas', informe.facturasActivas],
        ['Facturas canceladas', informe.facturasCanceladas],
        ['Facturas con devolución parcial', informe.facturasDevueltasParcial],
        ['Facturas con devolución total', informe.facturasDevueltasTotal],
        ['Valor cancelado', this.formatearMoneda(informe.valorCancelado)],
        ['Valor devuelto', this.formatearMoneda(informe.valorDevuelto)],
        ['Productos vendidos netos', informe.productosVendidos],
        ['Productos devueltos', informe.productosDevueltos]
      ],
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: [108, 117, 125]
      }
    });

    siguienteY = (doc as any).lastAutoTable.finalY + 8;

    autoTable(doc, {
      startY: siguienteY,
      head: [['Inventario actual', 'Valor']],
      body: [
        ['Unidades disponibles', informe.unidadesInventarioActual],
        ['Costo inventario actual', this.formatearMoneda(informe.costoInventarioActual)],
        ['Valor comercial inventario actual', this.formatearMoneda(informe.valorComercialInventarioActual)],
        ['Utilidad proyectada inventario', this.formatearMoneda(informe.utilidadProyectadaInventario)]
      ],
      styles: {
        fontSize: 9
      },
      headStyles: {
        fillColor: [25, 135, 84]
      }
    });

    doc.addPage('landscape');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Consolidado por día',
      14,
      16
    );

    autoTable(doc, {
      startY: 24,
      head: [[
        'Fecha',
        'Facturas',
        'Productos',
        'Ventas brutas',
        'Descuentos',
        'Ventas netas',
        'Costo vendido',
        'Utilidad'
      ]],
      body: informe.ventasPorDia.map(dia => [
        dia.fecha,
        dia.facturas,
        dia.productosVendidos,
        this.formatearMoneda(dia.ventasBrutas),
        this.formatearMoneda(dia.descuentos),
        this.formatearMoneda(dia.ventasNetas),
        this.formatearMoneda(dia.costoVendido),
        this.formatearMoneda(dia.utilidad)
      ]),
      styles: {
        fontSize: 8
      },
      headStyles: {
        fillColor: [13, 110, 253]
      }
    });

    doc.save(
      this.generarNombreArchivo('informe-ventas', 'pdf')
    );
  }


  private formatearMoneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  private generarNombreArchivo(nombreBase: string, extension: string): string {
    const fecha = new Date();

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hour = String(fecha.getHours()).padStart(2, '0');
    const minute = String(fecha.getMinutes()).padStart(2, '0');

    return `${nombreBase}-${year}${month}${day}-${hour}${minute}.${extension}`;
  }
  calcularMargenUtilidad(): number {
    if (!this.informe || !this.informe.ventasNetas || this.informe.ventasNetas <= 0) {
      return 0;
    }

    return this.informe.utilidadBruta / this.informe.ventasNetas * 100;
  }

  calcularMargenOperativo(): number {
    if (!this.informe || !this.informe.ventasNetas || this.informe.ventasNetas <= 0) {
      return 0;
    }

    return this.informe.resultadoOperativoEstimado / this.informe.ventasNetas * 100;
  }

  obtenerVentasPorDia(): ResumenVentasDiaDTO[] {
    return this.informe?.ventasPorDia || [];
  }

  existenVentasPorDia(): boolean {
    return this.obtenerVentasPorDia().length > 0;
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private obtenerMensajeError(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }

    if (typeof error?.error === 'string') {
      return error.error;
    }

    if (error?.message) {
      return error.message;
    }

    return 'Ocurrió un error al generar el informe.';
  }
}
