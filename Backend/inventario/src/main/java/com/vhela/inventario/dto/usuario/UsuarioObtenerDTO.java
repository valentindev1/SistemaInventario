package com.vhela.inventario.dto.usuario;

import lombok.Data;



@Data
public class UsuarioObtenerDTO {

    private Long id;
    private String nombre;
    private String username;
    private String rol;

    private Long empresaId;
    private String empresaNombre;

    private Long sucursalId;
    private String sucursalNombre;

    private Boolean puedeModificar;

    private String motivoBloqueo;
}
