package com.vhela.inventario.servicio.producto.detalles.color;


import com.vhela.inventario.dto.producto.detalles.color.ColorCrearDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorEditarDTO;
import com.vhela.inventario.dto.producto.detalles.color.ColorObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.detalles.Color;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;

import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.ColorRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ColorServicioImpl implements ColorServicio {

    private final ColorRepositorio colorRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;

    // ✅ CREAR COLOR
    @Override
    public ColorObtenerDTO crear(Long usuarioId, ColorCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionColor(usuario);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String nombreNormalizado = normalizarTexto(dto.getNombre());

        if (colorRepositorio.existsByNombreAndEmpresaId(nombreNormalizado, empresa.getId())) {
            throw new RuntimeException("Ya existe un color con ese nombre en la empresa");
        }

        Color color = new Color();
        color.setNombre(nombreNormalizado);
        color.setEmpresa(empresa);

        Color guardado = colorRepositorio.save(color);

        return mapToDTO(guardado);
    }

    // ✅ LISTAR COLORES SEGÚN ROL
    @Override
    @Transactional(readOnly = true)
    public List<ColorObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return colorRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            return colorRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("No tienes permisos para listar colores");
    }

    // ✅ LISTAR COLORES POR EMPRESA
    @Override
    @Transactional(readOnly = true)
    public List<ColorObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No tienes permisos para listar colores");
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes listar colores de otra empresa");
            }
        }

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return colorRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ✅ OBTENER COLOR POR ID
    @Override
    @Transactional(readOnly = true)
    public ColorObtenerDTO obtenerPorId(Long usuarioId, Long colorId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Color color = colorRepositorio.findById(colorId)
                .orElseThrow(() -> new RuntimeException("Color no encontrado"));

        validarAccesoAEmpresa(usuario, color.getEmpresa().getId());

        return mapToDTO(color);
    }

    // ✅ EDITAR COLOR
    @Override
    public ColorObtenerDTO editar(Long usuarioId, Long colorId, ColorEditarDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionColor(usuario);

        Color color = colorRepositorio.findById(colorId)
                .orElseThrow(() -> new RuntimeException("Color no encontrado"));

        validarAccesoAEmpresa(usuario, color.getEmpresa().getId());

        String nuevoNombre = normalizarTexto(dto.getNombre());

        if (!color.getNombre().equalsIgnoreCase(nuevoNombre)
                && colorRepositorio.existsByNombreAndEmpresaId(nuevoNombre, color.getEmpresa().getId())) {

            throw new RuntimeException("Ya existe otro color con ese nombre en la empresa");
        }

        color.setNombre(nuevoNombre);

        Color actualizado = colorRepositorio.save(color);

        return mapToDTO(actualizado);
    }

    // ✅ ELIMINAR COLOR
    @Override
    public void eliminar(Long usuarioId, Long colorId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionColor(usuario);

        Color color = colorRepositorio.findById(colorId)
                .orElseThrow(() -> new RuntimeException("Color no encontrado"));

        validarAccesoAEmpresa(usuario, color.getEmpresa().getId());

        colorRepositorio.delete(color);
    }

    // ======================================================
    // MÉTODOS PRIVADOS DE APOYO
    // ======================================================

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarPermisoGestionColor(Usuario usuario) {

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede gestionar colores");
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

            if (usuario.getEmpresa() == null) {
                throw new RuntimeException("El ADMIN no tiene empresa asignada");
            }

            if (!usuario.getEmpresa().getId().equals(empresaIdDTO)) {
                throw new RuntimeException("ADMIN no puede crear colores en otra empresa");
            }

            return empresa;
        }

        throw new RuntimeException("No tienes permisos para crear colores");
    }

    private void validarAccesoAEmpresa(Usuario usuario, Long empresaId) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes acceder a colores de otra empresa");
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

    private ColorObtenerDTO mapToDTO(Color color) {

        ColorObtenerDTO dto = new ColorObtenerDTO();

        dto.setId(color.getId());
        dto.setNombre(color.getNombre());
        dto.setFechaCreacion(color.getFechaCreacion());

        if (color.getEmpresa() != null) {
            dto.setEmpresaId(color.getEmpresa().getId());
            dto.setEmpresaNombre(color.getEmpresa().getNombre());
        }

        return dto;
    }
}
