package com.vhela.inventario.dto.producto.atributocosto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import lombok.Data;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "descripcion",
        "empresaId",
        "categoriaId",
        "categoriaNombre",
        "activo",
        "fechaCreacion"
})
public class AtributoCostoObtenerDTO {

    private Long id;
    private String nombre;
    private String descripcion;
    private Long empresaId;
    private Long categoriaId;
    private String categoriaNombre;
    private Boolean activo;
    private LocalDateTime fechaCreacion;
}
