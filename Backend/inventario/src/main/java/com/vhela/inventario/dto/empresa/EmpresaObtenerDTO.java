package com.vhela.inventario.dto.empresa;


import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Data;

import java.time.LocalDateTime;







@Data
@JsonPropertyOrder({
        "id",
        "nombre",
        "nit",
        "correo",
        "telefono",
        "direccion",
        "fechaCreacion"
})
public class EmpresaObtenerDTO {

    private Long id;

    private String nombre;

    private String nit;

    private String correo;

    private String telefono;

    private String direccion;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fechaCreacion;

}
