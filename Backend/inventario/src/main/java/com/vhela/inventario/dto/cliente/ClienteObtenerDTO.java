package com.vhela.inventario.dto.cliente;

import lombok.Data;

import java.time.LocalDateTime;


@Data
public class ClienteObtenerDTO {
    private Long id;

    private Long empresaId;

    private String empresaNombre;

    private String numeroDocumento;

    private String nombre;

    private String correo;

    private String telefono;

    private String direccion;

    private Boolean puedeModificar;

    private String motivoBloqueo;

    private LocalDateTime fechaCreacion;
}
