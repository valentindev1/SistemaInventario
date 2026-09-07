package com.vhela.inventario.servicio.comprasvarias;

import java.util.List;

import com.vhela.inventario.dto.comprasvarias.CompraVariasCrearDTO;
import com.vhela.inventario.dto.comprasvarias.CompraVariasDTO;

public interface ComprasVariasServicio {

    CompraVariasDTO registrar(Long usuarioId, Long sucursalId, CompraVariasCrearDTO dto);

    List<CompraVariasDTO> listarPorSucursal(Long usuarioId, Long sucursalId);

    void eliminar(Long usuarioId, Long sucursalId, Long registroId);
}
