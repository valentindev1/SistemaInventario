package com.vhela.inventario.dto.inventario.empleado;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class MovimientoInventarioEmpleadoDTO {

    private Long id;

    private String tipo;

    private Long productoId;
    private String productoCodigo;
    private String productoNombre;

    private Long sucursalId;
    private String sucursalNombre;

    private Integer cantidad;
    private Integer stockAntes;
    private Integer stockDespues;

    private BigDecimal precioVentaMomento;

    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioRol;

    private String motivo;
    private Long referenciaId;

    private LocalDateTime fecha;
}