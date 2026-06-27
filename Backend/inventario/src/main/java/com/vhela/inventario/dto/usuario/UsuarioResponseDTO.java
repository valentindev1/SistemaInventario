package com.example.vhelasoft.dto.usuario;

import lombok.Data;

@Data
public class UsuarioResponseDTO {


    private Long id;
    private String nombre;
    private String username;
    private String rol;
    private Long sucursalId;
    private String nombreSucursal;
    private Long fabricaId;
    private String nombreFabrica;


}
