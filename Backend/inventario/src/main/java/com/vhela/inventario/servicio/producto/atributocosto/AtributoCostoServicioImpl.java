package com.vhela.inventario.servicio.producto.atributocosto;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoCrearDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoEditarDTO;
import com.vhela.inventario.dto.producto.atributocosto.AtributoCostoObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.AtributoCosto;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.producto.AtributoCostoRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.CategoriaRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AtributoCostoServicioImpl implements AtributoCostoServicio {

    private final AtributoCostoRepositorio atributoCostoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final CategoriaRepositorio categoriaRepositorio;

    @Override
    public AtributoCostoObtenerDTO crear(Long usuarioId, AtributoCostoCrearDTO dto) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        Empresa empresa = obtenerEmpresa(dto.getEmpresaId());
        validarAccesoAEmpresa(usuario, empresa.getId());

        Categoria categoria = obtenerCategoria(dto.getCategoriaId());
        validarCategoriaPerteneceAEmpresa(categoria, empresa.getId());

        String nombre = normalizarTexto(dto.getNombre());
        atributoCostoRepositorio.findByCategoriaIdAndNombreIgnoreCase(categoria.getId(), nombre)
                .filter(AtributoCosto::getActivo)
                .ifPresent(atributo -> {
                    throw new RuntimeException(
                            "Ya existe un atributo de costo activo con ese nombre en la categoría"
                    );
                });

        AtributoCosto atributo = new AtributoCosto();
        atributo.setNombre(nombre);
        atributo.setDescripcion(normalizarDescripcion(dto.getDescripcion()));
        atributo.setEmpresa(empresa);
        atributo.setCategoria(categoria);
        atributo.setActivo(true);

        return mapToDTO(atributoCostoRepositorio.save(atributo));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtributoCostoObtenerDTO> listarPorEmpresa(Long usuarioId, Long empresaId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        Empresa empresa = obtenerEmpresa(empresaId);
        validarAccesoAEmpresa(usuario, empresa.getId());

        return atributoCostoRepositorio.findByEmpresaIdOrderByCategoriaNombreAscNombreAsc(
                        empresa.getId()
                )
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtributoCostoObtenerDTO> listarActivosPorCategoria(
            Long usuarioId,
            Long categoriaId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        Categoria categoria = obtenerCategoria(categoriaId);
        validarAccesoAEmpresa(usuario, categoria.getEmpresa().getId());

        return atributoCostoRepositorio.findByCategoriaIdAndActivoTrueOrderByNombreAsc(categoriaId)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public AtributoCostoObtenerDTO editar(
            Long usuarioId,
            Long atributoId,
            AtributoCostoEditarDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        AtributoCosto atributo = obtenerAtributo(atributoId);
        validarAccesoAEmpresa(usuario, atributo.getEmpresa().getId());

        Categoria categoria = obtenerCategoria(dto.getCategoriaId());
        validarCategoriaPerteneceAEmpresa(categoria, atributo.getEmpresa().getId());

        String nombre = normalizarTexto(dto.getNombre());
        atributoCostoRepositorio.findByCategoriaIdAndNombreIgnoreCase(categoria.getId(), nombre)
                .filter(otro -> !otro.getId().equals(atributoId) && otro.getActivo())
                .ifPresent(otro -> {
                    throw new RuntimeException(
                            "Ya existe un atributo de costo activo con ese nombre en la categoría"
                    );
                });

        atributo.setNombre(nombre);
        atributo.setDescripcion(normalizarDescripcion(dto.getDescripcion()));
        atributo.setCategoria(categoria);

        return mapToDTO(atributoCostoRepositorio.save(atributo));
    }

    @Override
    public void eliminar(Long usuarioId, Long atributoId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        AtributoCosto atributo = obtenerAtributo(atributoId);
        validarAccesoAEmpresa(usuario, atributo.getEmpresa().getId());

        atributo.setActivo(false);
        atributoCostoRepositorio.save(atributo);
    }

    @Override
    public AtributoCostoObtenerDTO activar(Long usuarioId, Long atributoId) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermiso(usuario);

        AtributoCosto atributo = obtenerAtributo(atributoId);
        validarAccesoAEmpresa(usuario, atributo.getEmpresa().getId());

        atributoCostoRepositorio.findByCategoriaIdAndNombreIgnoreCase(
                        atributo.getCategoria().getId(),
                        atributo.getNombre()
                )
                .filter(otro -> !otro.getId().equals(atributoId) && otro.getActivo())
                .ifPresent(otro -> {
                    throw new RuntimeException(
                            "Ya existe otro atributo activo con el mismo nombre en la categoría"
                    );
                });

        atributo.setActivo(true);
        return mapToDTO(atributoCostoRepositorio.save(atributo));
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Empresa obtenerEmpresa(Long empresaId) {
        return empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
    }

    private Categoria obtenerCategoria(Long categoriaId) {
        return categoriaRepositorio.findById(categoriaId)
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));
    }

    private AtributoCosto obtenerAtributo(Long atributoId) {
        return atributoCostoRepositorio.findById(atributoId)
                .orElseThrow(() -> new RuntimeException("Atributo de costo no encontrado"));
    }

    private void validarPermiso(Usuario usuario) {
        if (usuario.getRol() != RolEnum.SUPER_ADMIN && usuario.getRol() != RolEnum.ADMIN) {
            throw new RuntimeException("No tienes permisos para gestionar atributos de costo");
        }
    }

    private void validarAccesoAEmpresa(Usuario usuario, Long empresaId) {
        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null || !usuario.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puedes gestionar atributos de otra empresa");
        }
    }

    private void validarCategoriaPerteneceAEmpresa(Categoria categoria, Long empresaId) {
        if (!categoria.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("La categoría no pertenece a la empresa");
        }
    }

    private String normalizarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            throw new RuntimeException("El nombre del atributo de costo es obligatorio");
        }

        return texto.trim();
    }

    private String normalizarDescripcion(String descripcion) {
        return descripcion == null || descripcion.isBlank() ? null : descripcion.trim();
    }

    private AtributoCostoObtenerDTO mapToDTO(AtributoCosto atributo) {
        AtributoCostoObtenerDTO dto = new AtributoCostoObtenerDTO();
        dto.setId(atributo.getId());
        dto.setNombre(atributo.getNombre());
        dto.setDescripcion(atributo.getDescripcion());
        dto.setEmpresaId(atributo.getEmpresa().getId());
        dto.setCategoriaId(atributo.getCategoria().getId());
        dto.setCategoriaNombre(atributo.getCategoria().getNombre());
        dto.setActivo(atributo.getActivo());
        dto.setFechaCreacion(atributo.getFechaCreacion());
        return dto;
    }
}
