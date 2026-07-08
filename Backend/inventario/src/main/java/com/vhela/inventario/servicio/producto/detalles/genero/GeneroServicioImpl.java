package com.vhela.inventario.servicio.producto.detalles.genero;

import com.vhela.inventario.dto.producto.detalles.genero.GeneroCrearDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroEditarDTO;
import com.vhela.inventario.dto.producto.detalles.genero.GeneroObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.detalles.Genero;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.GeneroRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GeneroServicioImpl implements GeneroServicio {

    private final GeneroRepositorio generoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;

    // ✅ CREAR GÉNERO
    @Override
    public GeneroObtenerDTO crear(Long usuarioId, GeneroCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionGenero(usuario);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String nombreNormalizado = normalizarTexto(dto.getNombre());

        if (generoRepositorio.existsByNombreAndEmpresaId(nombreNormalizado, empresa.getId())) {
            throw new RuntimeException("Ya existe un género con ese nombre en la empresa");
        }

        Genero genero = new Genero();
        genero.setNombre(nombreNormalizado);
        genero.setEmpresa(empresa);

        Genero guardado = generoRepositorio.save(genero);

        return mapToDTO(guardado);
    }

    // ✅ LISTAR GÉNEROS SEGÚN ROL
    @Override
    @Transactional(readOnly = true)
    public List<GeneroObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return generoRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            return generoRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("No tienes permisos para listar géneros");
    }

    // ✅ LISTAR GÉNEROS POR EMPRESA
    @Override
    @Transactional(readOnly = true)
    public List<GeneroObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No tienes permisos para listar géneros");
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes listar géneros de otra empresa");
            }
        }

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return generoRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // ✅ OBTENER GÉNERO POR ID
    @Override
    @Transactional(readOnly = true)
    public GeneroObtenerDTO obtenerPorId(Long usuarioId, Long generoId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Genero genero = generoRepositorio.findById(generoId)
                .orElseThrow(() -> new RuntimeException("Género no encontrado"));

        validarAccesoAEmpresa(usuario, genero.getEmpresa().getId());

        return mapToDTO(genero);
    }

    // ✅ EDITAR GÉNERO
    @Override
    public GeneroObtenerDTO editar(Long usuarioId, Long generoId, GeneroEditarDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionGenero(usuario);

        Genero genero = generoRepositorio.findById(generoId)
                .orElseThrow(() -> new RuntimeException("Género no encontrado"));

        validarAccesoAEmpresa(usuario, genero.getEmpresa().getId());

        String nuevoNombre = normalizarTexto(dto.getNombre());

        if (!genero.getNombre().equalsIgnoreCase(nuevoNombre)
                && generoRepositorio.existsByNombreAndEmpresaId(nuevoNombre, genero.getEmpresa().getId())) {

            throw new RuntimeException("Ya existe otro género con ese nombre en la empresa");
        }

        genero.setNombre(nuevoNombre);

        Genero actualizado = generoRepositorio.save(genero);

        return mapToDTO(actualizado);
    }

    // ✅ ELIMINAR GÉNERO
    @Override
    public void eliminar(Long usuarioId, Long generoId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionGenero(usuario);

        Genero genero = generoRepositorio.findById(generoId)
                .orElseThrow(() -> new RuntimeException("Género no encontrado"));

        validarAccesoAEmpresa(usuario, genero.getEmpresa().getId());

        generoRepositorio.delete(genero);
    }

    // ======================================================
    // MÉTODOS PRIVADOS
    // ======================================================

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarPermisoGestionGenero(Usuario usuario) {

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede gestionar géneros");
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
                throw new RuntimeException("ADMIN no puede crear géneros en otra empresa");
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
                throw new RuntimeException("No puedes acceder a géneros de otra empresa");
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

    private GeneroObtenerDTO mapToDTO(Genero genero) {

        GeneroObtenerDTO dto = new GeneroObtenerDTO();

        dto.setId(genero.getId());
        dto.setNombre(genero.getNombre());
        dto.setFechaCreacion(genero.getFechaCreacion());

        if (genero.getEmpresa() != null) {
            dto.setEmpresaId(genero.getEmpresa().getId());
            dto.setEmpresaNombre(genero.getEmpresa().getNombre());
        }

        return dto;
    }
}