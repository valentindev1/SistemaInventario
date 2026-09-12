package com.vhela.inventario.dto.informes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.Data;

@Data
public class InformeFinancieroEmpresaDTO {

    private Long empresaId;
    private String empresaNombre;
    private Long sucursalId;
    private String sucursalNombre;
    private LocalDate fechaInicio;
    private LocalDate fechaFin;
    private Integer cantidadSucursalesIncluidas;

    private Integer facturasEmitidas;
    private Integer facturasEfectivas;
    private Integer facturasCanceladas;
    private Integer unidadesVendidas;
    private Integer unidadesDevueltas;

    private BigDecimal ventasBrutas;
    private BigDecimal descuentos;
    private BigDecimal ingresosNetos;
    private BigDecimal costoProductosVendidos;
    private BigDecimal utilidadBruta;
    private BigDecimal costosIndirectos;
    private BigDecimal gastos;
    private BigDecimal perdidasAjustesInventario;
    private BigDecimal egresosOperativos;
    private BigDecimal utilidadNeta;
    private BigDecimal margenBruto;
    private BigDecimal margenNeto;

    private Boolean comprasVariasIncluidas;

    private InformeFinancieroTipoProductoDTO productosRemanufacturados;
    private InformeFinancieroTipoProductoDTO productosConvencionales;
    private List<InformeFinancieroPeriodoDTO> periodos;
    private List<InformeFinancieroSucursalDTO> sucursales;
    private List<InformeFinancieroClasificacionDTO> egresosPorClasificacion;
}
