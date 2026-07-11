package com.vhela.inventario.dto.venta.empleado.producto;


import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
        "tallaId",
        "tallaNombre",
        "generoId",
        "generoNombre",
        "precioVenta",
        "fechaCreacion"
})
public class ProductoEmpleadoObtenerDTO {

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

    private Long tallaId;
    private String tallaNombre;

    private Long generoId;
    private String generoNombre;

    private BigDecimal precioVenta;

    private LocalDateTime fechaCreacion;
}
