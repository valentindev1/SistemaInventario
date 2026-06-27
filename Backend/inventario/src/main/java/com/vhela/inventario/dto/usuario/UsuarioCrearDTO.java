package com.example.vhelasoft.dto.usuario;

import lombok.Data;

@Data
public class UsuarioCrearDTO {

    private String nombre;
    private String username;
    private String password;
    private String rol;


    /**
     * El frontend SOLO envía la sucursal,
     * la fábrica se hereda automáticamente
     */


    private Long sucursalId;

}
