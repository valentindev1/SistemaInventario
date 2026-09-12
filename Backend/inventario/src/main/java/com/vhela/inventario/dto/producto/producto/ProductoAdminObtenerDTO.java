package com.vhela.inventario.dto.producto.producto;



import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.Data;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "codigo",
        "descripcion",
        "empresaId",
        "empresaNombre",
        "colorId",
        "colorNombre",
        "categoriaId",
        "categoriaNombre",
        "categoriaTipoGanancia",
        "categoriaValorGanancia",
        "categoriaPorcentajeGanancia",
        "tipoGananciaProducto",
        "valorGananciaProducto",
        "tallaId",
        "tallaNombre",
        "generoId",
        "generoNombre",
        "tipoCosto",
        "esRemanufacturado",
        "costoPersonalizado",
        "desgloseCosto",
        "costoUnitario",
        "precioVenta",
        "fechaCreacion"
})
public class ProductoAdminObtenerDTO {

    private Long id;

    private String nombre;
    private String codigo;
    private String descripcion;

    private Long empresaId;
    private String empresaNombre;

    private Long colorId;
    private String colorNombre;

    private Long categoriaId;
    private String categoriaNombre;

    private String categoriaTipoGanancia;

    private BigDecimal categoriaValorGanancia;

    private BigDecimal categoriaPorcentajeGanancia;

    private String tipoGananciaProducto;

    private BigDecimal valorGananciaProducto;

    private Long tallaId;
    private String tallaNombre;

    private Long generoId;
    private String generoNombre;

    private String tipoCosto;

    private Boolean esRemanufacturado;

    private Boolean costoPersonalizado;

    private List<ProductoCostoDetalleDTO> desgloseCosto;

    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;


    private Boolean puedeModificar;
    private String motivoBloqueo;


    private LocalDateTime fechaCreacion;
}
