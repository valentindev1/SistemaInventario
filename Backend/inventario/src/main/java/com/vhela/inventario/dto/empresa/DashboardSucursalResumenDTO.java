package com.vhela.inventario.dto.empresa;


import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardSucursalResumenDTO {

    private Long sucursalId;
    private String sucursalNombre;

    private Integer unidadesInventario;
    private Integer referenciasInventario;

    private Integer productosAgotados;
    private Integer productosBajoStock;

    private BigDecimal costoInventario;
    private BigDecimal valorComercialInventario;
    private BigDecimal utilidadProyectadaInventario;

    private Integer facturasEmitidas;
    private Integer facturasActivas;
    private Integer facturasCanceladas;

    private BigDecimal ventasBrutas;
    private BigDecimal descuentos;
    private BigDecimal ventasNetas;

    private BigDecimal costoVendido;
    private BigDecimal utilidadBruta;

    private BigDecimal costoAjustesNegativos;
    private Integer unidadesAjustadasNegativas;

    private BigDecimal resultadoOperativoEstimado;
}