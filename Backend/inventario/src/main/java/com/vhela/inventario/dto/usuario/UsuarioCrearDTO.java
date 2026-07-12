package com.vhela.inventario.dto.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;



@Data
public class UsuarioCrearDTO {


    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;


    @NotBlank(message = "El username es obligatorio")
    @Size(min = 4, max = 20, message = "El username debe tener entre 4 y 20 caracteres")
    @Pattern(
            regexp = "^[A-Za-z0-9_]+$",
            message = "El username solo puede contener letras, números y guion bajo, sin espacios ni caracteres especiales"
    )
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener mínimo 6 caracteres")
    private String password;

    @NotBlank(message = "El rol es obligatorio")
    private String rol;

    private Long empresaId;   //  requerido según rol
    private Long sucursalId;  //  requerido según rol

}

