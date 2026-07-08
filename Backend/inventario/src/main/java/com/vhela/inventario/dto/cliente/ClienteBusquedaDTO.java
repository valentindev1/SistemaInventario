package com.vhela.inventario.dto.cliente;



import lombok.Data;


@Data
public class ClienteBusquedaDTO {

    private Long id;

    private String numeroDocumento;

    private String nombre;

}