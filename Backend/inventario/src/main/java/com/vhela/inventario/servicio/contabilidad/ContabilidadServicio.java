package com.vhela.inventario.servicio.contabilidad;

import java.util.List;

import com.vhela.inventario.dto.contabilidad.RegistroContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.RegistroContableDTO;
import com.vhela.inventario.dto.contabilidad.RegistroGastoEmpleadoDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableCrearDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableDTO;
import com.vhela.inventario.dto.contabilidad.ClasificacionContableEditarDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoCrearDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoDTO;
import com.vhela.inventario.dto.contabilidad.ConceptoGastoEditarDTO;

public interface ContabilidadServicio {

    RegistroContableDTO registrar(
            Long usuarioId,
            Long sucursalId,
            RegistroContableCrearDTO dto
    );

    List<RegistroContableDTO> listarPorSucursal(Long usuarioId, Long sucursalId);

    List<RegistroContableDTO> listarGastosEmpleado(
            Long usuarioId,
            Long sucursalId
    );

    RegistroContableDTO registrarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            RegistroGastoEmpleadoDTO dto
    );

    RegistroContableDTO editarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            Long registroId,
            RegistroGastoEmpleadoDTO dto
    );

    void eliminarGastoEmpleado(
            Long usuarioId,
            Long sucursalId,
            Long registroId
    );

    ConceptoGastoDTO crearConcepto(Long usuarioId, ConceptoGastoCrearDTO dto);

    List<ConceptoGastoDTO> listarConceptosPorEmpresa(Long usuarioId, Long empresaId);

    List<ConceptoGastoDTO> listarConceptosActivosPorEmpresa(Long usuarioId, Long empresaId);

    ConceptoGastoDTO editarConcepto(
            Long usuarioId,
            Long conceptoId,
            ConceptoGastoEditarDTO dto
    );

    void eliminarConcepto(Long usuarioId, Long conceptoId);

    ClasificacionContableDTO crearClasificacion(Long usuarioId, ClasificacionContableCrearDTO dto);

    List<ClasificacionContableDTO> listarClasificacionesPorEmpresa(Long usuarioId, Long empresaId);

    ClasificacionContableDTO editarClasificacion(
            Long usuarioId,
            Long clasificacionId,
            ClasificacionContableEditarDTO dto
    );

    void eliminarClasificacion(Long usuarioId, Long clasificacionId);
}
