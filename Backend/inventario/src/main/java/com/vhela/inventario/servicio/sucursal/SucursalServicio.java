package com.vhela.inventario.servicio.sucursal;

import com.vhela.inventario.dto.sucursal.SucursalCrearDTO;
import com.vhela.inventario.dto.sucursal.SucursalEditarDTO;
import com.vhela.inventario.dto.sucursal.SucursalObtenerDTO;

import java.util.List;


public interface SucursalServicio {

    SucursalObtenerDTO crear(Long usuarioId, SucursalCrearDTO dto);

    List<SucursalObtenerDTO> listar(Long usuarioId);

    SucursalObtenerDTO obtenerPorId(Long usuarioId, Long id);

    List<SucursalObtenerDTO> listarPorEmpresa(Long usuarioId, String empresaNit);

    SucursalObtenerDTO editar(Long usuarioId, Long id, SucursalEditarDTO dto);

    void eliminar(Long usuarioId, Long id);


}
