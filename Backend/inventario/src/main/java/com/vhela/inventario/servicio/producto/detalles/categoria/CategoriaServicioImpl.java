package com.vhela.inventario.servicio.producto.detalles.categoria;

import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;

import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;

import com.vhela.inventario.repositorio.producto.detalles.CategoriaRepositorio;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoriaServicioImpl implements CategoriaServicio {

    private final CategoriaRepositorio categoriaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;

    // CREAR CATEGORÍA
    @Override
    public CategoriaObtenerDTO crear(Long usuarioId, CategoriaCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionCategoria(usuario);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String nombreNormalizado = normalizarTexto(dto.getNombre());

        if (categoriaRepositorio.existsByNombreAndEmpresaId(nombreNormalizado, empresa.getId())) {
            throw new RuntimeException("Ya existe una categoría con ese nombre en la empresa");
        }

        Categoria categoria = new Categoria();
        categoria.setNombre(nombreNormalizado);
        categoria.setEmpresa(empresa);

        Categoria guardada = categoriaRepositorio.save(categoria);

        return mapToDTO(guardada);
    }

    // LISTAR CATEGORÍAS SEGÚN ROL
    @Override
    @Transactional(readOnly = true)
    public List<CategoriaObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return categoriaRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            return categoriaRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("No tienes permisos para listar categorías");
    }

    // LISTAR CATEGORÍAS POR EMPRESA
    @Override
    @Transactional(readOnly = true)
    public List<CategoriaObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("No tienes permisos para listar categorías");
        }

        if (usuario.getRol() == RolEnum.ADMIN) {

            validarAdminConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaId)) {
                throw new RuntimeException("No puedes listar categorías de otra empresa");
            }
        }

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        return categoriaRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    // OBTENER CATEGORÍA POR ID
    @Override
    @Transactional(readOnly = true)
    public CategoriaObtenerDTO obtenerPorId(Long usuarioId, Long categoriaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Categoria categoria = categoriaRepositorio.findById(categoriaId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        validarAccesoAEmpresa(usuario, categoria.getEmpresa().getId());

        return mapToDTO(categoria);
    }

    // EDITAR CATEGORÍA
    @Override
    public CategoriaObtenerDTO editar(Long usuarioId, Long categoriaId, CategoriaEditarDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionCategoria(usuario);

        Categoria categoria = categoriaRepositorio.findById(categoriaId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        validarAccesoAEmpresa(usuario, categoria.getEmpresa().getId());

        String nuevoNombre = normalizarTexto(dto.getNombre());

        if (!categoria.getNombre().equalsIgnoreCase(nuevoNombre)
                && categoriaRepositorio.existsByNombreAndEmpresaId(nuevoNombre, categoria.getEmpresa().getId())) {

            throw new RuntimeException("Ya existe otra categoría con ese nombre en la empresa");
        }

        categoria.setNombre(nuevoNombre);

        Categoria actualizada = categoriaRepositorio.save(categoria);

        return mapToDTO(actualizada);
    }

    // ELIMINAR CATEGORÍA
    @Override
    public void eliminar(Long usuarioId, Long categoriaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionCategoria(usuario);

        Categoria categoria = categoriaRepositorio.findById(categoriaId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        validarAccesoAEmpresa(usuario, categoria.getEmpresa().getId());

        categoriaRepositorio.delete(categoria);
    }

    // ======================================================
    // MÉTODOS PRIVADOS
    // ======================================================

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarPermisoGestionCategoria(Usuario usuario) {

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede gestionar categorías");
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
                throw new RuntimeException("ADMIN no puede crear categorías en otra empresa");
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
                throw new RuntimeException("No puedes acceder a categorías de otra empresa");
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

    private CategoriaObtenerDTO mapToDTO(Categoria categoria) {

        CategoriaObtenerDTO dto = new CategoriaObtenerDTO();

        dto.setId(categoria.getId());
        dto.setNombre(categoria.getNombre());
        dto.setFechaCreacion(categoria.getFechaCreacion());

        if (categoria.getEmpresa() != null) {
            dto.setEmpresaId(categoria.getEmpresa().getId());
            dto.setEmpresaNombre(categoria.getEmpresa().getNombre());
        }

        return dto;
    }
}