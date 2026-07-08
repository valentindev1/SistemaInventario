package com.vhela.inventario.servicio.producto.detalles.talla;

import com.vhela.inventario.dto.producto.detalles.talla.TallaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.talla.TallaObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.detalles.Talla;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;

import com.vhela.inventario.repositorio.UsuarioRepositorio;

import com.vhela.inventario.repositorio.producto.detalles.TallaRepositorio;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TallaServicioImpl implements TallaServicio {

    private final TallaRepositorio tallaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;

    // ✅ CREAR TALLA
    @Override
    public TallaObtenerDTO crear(Long usuarioId, TallaCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionTalla(usuario);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String nombreNormalizado = normalizarTexto(dto.getNombre());

        if (tallaRepositorio.existsByNombreAndEmpresaId(nombreNormalizado, empresa.getId())) {
            throw new RuntimeException("Ya existe una talla con ese nombre en la empresa");
        }

        Talla talla = new Talla();
        talla.setNombre(nombreNormalizado);
        talla.setEmpresa(empresa);

        Talla guardada = tallaRepositorio.save(talla);

        return mapToDTO(guardada);
    }

    // ✅ LISTAR TALLAS SEGÚN ROL
    @Override
    @Transactional(readOnly = true)
    public List<TallaObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return tallaRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            return tallaRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("No tienes permisos para listar tallas");
    }

    // ✅ LISTAR TALLAS POR EMPRESA
    @Override
    @Transactional(readOnly = true)
    public List<TallaObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No tienes permisos para listar tallas");
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes listar tallas de otra empresa");
            }
        }

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return tallaRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ✅ OBTENER TALLA POR ID
    @Override
    @Transactional(readOnly = true)
    public TallaObtenerDTO obtenerPorId(Long usuarioId, Long tallaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Talla talla = tallaRepositorio.findById(tallaId)
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        validarAccesoAEmpresa(usuario, talla.getEmpresa().getId());

        return mapToDTO(talla);
    }

    // ✅ EDITAR TALLA
    @Override
    public TallaObtenerDTO editar(Long usuarioId, Long tallaId, TallaEditarDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionTalla(usuario);

        Talla talla = tallaRepositorio.findById(tallaId)
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        validarAccesoAEmpresa(usuario, talla.getEmpresa().getId());

        String nuevoNombre = normalizarTexto(dto.getNombre());

        if (!talla.getNombre().equalsIgnoreCase(nuevoNombre)
                && tallaRepositorio.existsByNombreAndEmpresaId(nuevoNombre, talla.getEmpresa().getId())) {

            throw new RuntimeException("Ya existe otra talla con ese nombre en la empresa");
        }

        talla.setNombre(nuevoNombre);

        Talla actualizada = tallaRepositorio.save(talla);

        return mapToDTO(actualizada);
    }

    // ✅ ELIMINAR TALLA
    @Override
    public void eliminar(Long usuarioId, Long tallaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionTalla(usuario);

        Talla talla = tallaRepositorio.findById(tallaId)
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        validarAccesoAEmpresa(usuario, talla.getEmpresa().getId());

        tallaRepositorio.delete(talla);
    }

    // ======================================================
    // MÉTODOS PRIVADOS
    // ======================================================

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarPermisoGestionTalla(Usuario usuario) {

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede gestionar tallas");
        }

        if (usuario.getRol() != RolEnum.SUPER_ADMIN && usuario.getRol() != RolEnum.ADMIN) {
            throw new RuntimeException("Rol no permitido");
        }
    }

    private Empresa determinarEmpresaDestino(Usuario usuario, Long empresaIdDTO) {

        if (empresaIdDTO == null) {
            throw new RuntimeException("El ID de la empresa es obligatorio");
        }

        Empresa empresa = empresaRepositorio.findById(empresaIdDTO)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return empresa;
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaIdDTO)) {
                throw new RuntimeException("ADMIN no puede crear tallas en otra empresa");
            }

            return empresa;
        }

        throw new RuntimeException("No tienes permisos para definir empresa");
    }

    private void validarAccesoAEmpresa(Usuario usuario, Long empresaId) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes acceder a tallas de otra empresa");
            }

            return;
        }

        throw new RuntimeException("No tienes permisos");
    }

    private void validarAdminConEmpresa(Usuario usuario) {

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El ADMIN no tiene empresa asignada");
        }
    }

    private String normalizarTexto(String texto) {
        return texto.trim();
    }

    private TallaObtenerDTO mapToDTO(Talla talla) {

        TallaObtenerDTO dto = new TallaObtenerDTO();

        dto.setId(talla.getId());
        dto.setNombre(talla.getNombre());
        dto.setFechaCreacion(talla.getFechaCreacion());

        if (talla.getEmpresa() != null) {
            dto.setEmpresaId(talla.getEmpresa().getId());
            dto.setEmpresaNombre(talla.getEmpresa().getNombre());
        }

        return dto;
    }
}