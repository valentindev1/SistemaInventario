package com.vhela.inventario.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {

    private String token;
    private String tipo;

    private Long usuarioId;
    private String username;
    private String nombre;
    private String rol;

    private Long empresaId;
    private Long sucursalId;
}