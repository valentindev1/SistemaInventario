package com.vhela.inventario.dto.producto.empleado;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class ProductoResponseDTO {

    private Long id;
    private String nombre;
    private String codigo;
    private BigDecimal costoUnitario;
    private BigDecimal precioVenta;
    private Long empresaId;
    private String nombreEmpresa;
    private String categoria;
    private String color;
    private String talla;
    private String genero;
    private LocalDateTime fechaCreacion;

}
