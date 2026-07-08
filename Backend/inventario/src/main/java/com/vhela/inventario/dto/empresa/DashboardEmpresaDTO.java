package com.vhela.inventario.dto.empresa;


import lombok.Data;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.util.List;

@Data
public class DashboardEmpresaDTO {

    private Long empresaId;
    private String empresaNombre;

    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    private Integer cantidadSucursales;

    private Integer unidadesInventarioTotal;
    private Integer referenciasInventarioTotal;

    private Integer productosAgotados;
    private Integer productosBajoStock;
    private Integer productosAltoStock;

    private BigDecimal costoInventarioTotal;
    private BigDecimal valorComercialInventarioTotal;
    private BigDecimal utilidadProyectadaInventario;

    private Integer facturasEmitidas;
    private Integer facturasActivas;
    private Integer facturasCanceladas;
    private Integer facturasDevueltasParcial;
    private Integer facturasDevueltasTotal;

    private Integer productosVendidos;
    private Integer productosDevueltos;

    private BigDecimal ventasBrutas;
    private BigDecimal descuentos;
    private BigDecimal ventasNetas;

    private BigDecimal costoVendido;
    private BigDecimal utilidadBruta;

    private BigDecimal valorCancelado;
    private BigDecimal valorDevuelto;

    private BigDecimal costoAjustesNegativos;
    private Integer unidadesAjustadasNegativas;

    private BigDecimal resultadoOperativoEstimado;

    private BigDecimal margenUtilidadBruta;
    private BigDecimal margenOperativo;

    private DashboardSucursalResumenDTO mejorSucursalVentas;
    private DashboardSucursalResumenDTO mejorSucursalUtilidad;
    private DashboardSucursalResumenDTO sucursalMayorInventario;
    private DashboardSucursalResumenDTO sucursalMasAjustesNegativos;

    private List<DashboardSucursalResumenDTO> sucursales;

    private List<DashboardProductoCriticoDTO> productosCriticos;
}