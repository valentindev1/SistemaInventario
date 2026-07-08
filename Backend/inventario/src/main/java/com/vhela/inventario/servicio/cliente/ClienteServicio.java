package com.vhela.inventario.servicio.cliente;

import com.vhela.inventario.dto.cliente.ClienteCrearDTO;
import com.vhela.inventario.dto.cliente.ClienteEditarDTO;
import com.vhela.inventario.dto.cliente.ClienteObtenerDTO;

import java.util.List;

public interface ClienteServicio {


    ClienteObtenerDTO crear(
            Long usuarioId,
            ClienteCrearDTO dto
    );

    List<ClienteObtenerDTO> listar(
            Long usuarioId
    );

    ClienteObtenerDTO obtenerPorId(
            Long usuarioId,
            Long clienteId
    );

    ClienteObtenerDTO obtenerPorDocumento(
            Long usuarioId,
            String documento
    );

    ClienteObtenerDTO editar(
            Long usuarioId,
            Long clienteId,
            ClienteEditarDTO dto
    );

    void eliminar(
            Long usuarioId,
            Long clienteId
    );

}
