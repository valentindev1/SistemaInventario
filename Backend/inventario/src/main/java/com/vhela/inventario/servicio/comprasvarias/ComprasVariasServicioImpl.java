package com.vhela.inventario.servicio.comprasvarias;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.comprasvarias.CompraVariasCrearDTO;
import com.vhela.inventario.dto.comprasvarias.CompraVariasDTO;
import com.vhela.inventario.modelo.comprasvarias.CompraVariasSucursal;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.comprasvarias.CompraVariasSucursalRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ComprasVariasServicioImpl implements ComprasVariasServicio {

    private final CompraVariasSucursalRepositorio repositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;

    @Override
    public CompraVariasDTO registrar(
            Long usuarioId,
            Long sucursalId,
            CompraVariasCrearDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarPermisoYAcceso(usuario, sucursal);

        if (dto.getValor().compareTo(BigDecimal.ZERO) == 0) {
            throw new RuntimeException("El valor debe ser positivo o negativo, pero distinto de cero");
        }

        CompraVariasSucursal registro = new CompraVariasSucursal();
        registro.setConcepto(normalizarRequerido(dto.getConcepto(), "El concepto es obligatorio"));
        registro.setDescripcion(normalizarOpcional(dto.getDescripcion()));
        registro.setValor(dto.getValor());
        registro.setFecha(dto.getFecha());
        registro.setSucursal(sucursal);
        registro.setUsuario(usuario);

        return mapear(repositorio.save(registro));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CompraVariasDTO> listarPorSucursal(Long usuarioId, Long sucursalId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarPermisoYAcceso(usuario, sucursal);

        return repositorio.findBySucursalIdOrderByFechaDescFechaCreacionDesc(sucursalId)
                .stream()
                .map(this::mapear)
                .toList();
    }

    @Override
    public void eliminar(Long usuarioId, Long sucursalId, Long registroId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        Sucursal sucursal = obtenerSucursal(sucursalId);
        validarPermisoYAcceso(usuario, sucursal);

        CompraVariasSucursal registro = repositorio.findById(registroId)
                .orElseThrow(() -> new RuntimeException("La compra varias no existe"));

        if (!registro.getSucursal().getId().equals(sucursalId)) {
            throw new RuntimeException("El registro no pertenece a esta sucursal");
        }

        repositorio.delete(registro);
    }

    private CompraVariasDTO mapear(CompraVariasSucursal registro) {
        CompraVariasDTO dto = new CompraVariasDTO();
        dto.setId(registro.getId());
        dto.setConcepto(registro.getConcepto());
        dto.setDescripcion(registro.getDescripcion());
        dto.setValor(registro.getValor());
        dto.setFecha(registro.getFecha());
        dto.setSucursalId(registro.getSucursal().getId());
        dto.setSucursalNombre(registro.getSucursal().getNombre());
        dto.setUsuarioId(registro.getUsuario().getId());
        dto.setUsuarioNombre(registro.getUsuario().getNombre());
        dto.setUsuarioRol(registro.getUsuario().getRol().name());
        dto.setFechaCreacion(registro.getFechaCreacion());
        return dto;
    }

    private void validarPermisoYAcceso(Usuario usuario, Sucursal sucursal) {
        if (usuario.getRol() != RolEnum.SUPER_ADMIN && usuario.getRol() != RolEnum.ADMIN) {
            throw new RuntimeException("No tiene permisos para gestionar compras varias");
        }

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null
                || sucursal.getEmpresa() == null
                || !sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
            throw new RuntimeException("No puede acceder a una sucursal de otra empresa");
        }
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Sucursal obtenerSucursal(Long sucursalId) {
        return sucursalRepositorio.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
    }

    private String normalizarRequerido(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new RuntimeException(mensaje);
        }
        return valor.trim();
    }

    private String normalizarOpcional(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }
}
