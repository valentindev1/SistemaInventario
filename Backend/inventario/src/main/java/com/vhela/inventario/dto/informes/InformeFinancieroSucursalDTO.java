package com.vhela.inventario.dto.informes;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InformeFinancieroSucursalDTO {

    private Long sucursalId;
    private String sucursalNombre;
    private Integer facturasEfectivas;
    private Integer unidadesVendidas;
    private BigDecimal ingresosNetos;
    private BigDecimal costoProductosVendidos;
    private BigDecimal utilidadBruta;
    private BigDecimal costosIndirectos;
    private BigDecimal gastos;
    private BigDecimal perdidasAjustesInventario;
    private BigDecimal utilidadNeta;
}
