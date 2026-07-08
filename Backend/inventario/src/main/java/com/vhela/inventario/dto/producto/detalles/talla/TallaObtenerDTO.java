package com.vhela.inventario.dto.producto.detalles.talla;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "empresaId",
        "empresaNombre",
        "fechaCreacion"
})
public class TallaObtenerDTO {

    private Long id;

    private String nombre;

    private Long empresaId;
    private String empresaNombre;

    private LocalDateTime fechaCreacion;
}