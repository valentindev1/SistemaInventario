package com.vhela.inventario.dto.producto.detalles.color;


import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.Data;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "empresaId",
        "empresaNombre",
        "fechaCreacion"
})
public class ColorObtenerDTO {

    private Long id;

    private String nombre;

    private Long empresaId;
    private String empresaNombre;

    private LocalDateTime fechaCreacion;
}
