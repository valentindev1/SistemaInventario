package com.vhela.inventario.dto.venta;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class InformeConsolidadoVentasDTO {

    private LocalDate fechaInicio;
    private LocalDate fechaFin;

    private Long sucursalId;
    private String sucursalNombre;

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

    private Integer unidadesInventarioActual;
    private BigDecimal costoInventarioActual;
    private BigDecimal valorComercialInventarioActual;
    private BigDecimal utilidadProyectadaInventario;

    private List<ResumenVentasDiaDTO> ventasPorDia;
}