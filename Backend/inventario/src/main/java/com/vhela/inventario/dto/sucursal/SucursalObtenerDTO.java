package com.vhela.inventario.dto.sucursal;


import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "ciudad",
        "direccion",
        "telefono",
        "empresaNit",
        "empresaNombre",

        "fechaCreacion"
})
public class SucursalObtenerDTO {

    private Long id;

    private String nombre;
    private String ciudad;
    private String direccion;
    private String telefono;


    // útil para mostrar info de empresa
    private String empresaNit;
    private String empresaNombre;

    private LocalDateTime fechaCreacion;


}
