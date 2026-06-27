package com.vhela.inventario.dto.usuario;

import lombok.Data;

@Data
public class UsuarioResponseDTO {

    private Long id;
    private String nombre;
    private String username;
    private String rol;

}
