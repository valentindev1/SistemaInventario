package com.vhela.inventario.servicio.empresa;

import com.vhela.inventario.dto.empresa.EmpresaCrearDTO;
import com.vhela.inventario.dto.empresa.EmpresaEditarDTO;
import com.vhela.inventario.dto.empresa.EmpresaObtenerDTO;

import java.util.List;


public interface EmpresaServicio {

    EmpresaObtenerDTO crear(Long usuarioId, EmpresaCrearDTO dto);

    List<EmpresaObtenerDTO> listar(Long usuarioId);

    EmpresaObtenerDTO obtenerPorId(Long usuarioId, Long idEmpresa);

    EmpresaObtenerDTO obtenerPorNit(Long usuarioId, String nitEmpresa);

    EmpresaObtenerDTO editar(Long usuarioId, Long idEmpresa, EmpresaEditarDTO dto);

    void eliminarPorId(Long usuarioId, Long idEmpresa);

    void eliminarPorNit(Long usuarioId, String nitEmpresa);
}
