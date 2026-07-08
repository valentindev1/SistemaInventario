package com.vhela.inventario.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClienteEditarDTO {


    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 3, max = 150,
            message = "El nombre debe tener entre 3 y 150 caracteres")
    private String nombre;

    @Email(message = "El correo electrónico no es válido")
    @Size(max = 150,
            message = "El correo no puede superar 150 caracteres")
    private String correo;

    @Size(max = 30,
            message = "El teléfono no puede superar 30 caracteres")
    private String telefono;




}
