package com.vhela.inventario.dto.producto.detalles.categoria;

import java.time.LocalDateTime;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.Data;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "empresaId",
        "empresaNombre",
        "tipoGanancia",
        "valorGanancia",
        "porcentajeGanancia",
        "fechaCreacion"
})
public class CategoriaObtenerDTO {

    private Long id;

    private String nombre;

    private Long empresaId;
    private String empresaNombre;

    private String tipoGanancia;

    private BigDecimal valorGanancia;

    private BigDecimal porcentajeGanancia;

    private LocalDateTime fechaCreacion;
}
