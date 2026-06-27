package com.vhela.inventario.dto.usuario;

import lombok.Data;

@Data
public class UsuarioCrearDTO {

    private String nombre;
    private String username;
    private String password;
    private String rol;

}
