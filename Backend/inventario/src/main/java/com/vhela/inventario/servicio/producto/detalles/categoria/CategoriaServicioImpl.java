package com.vhela.inventario.servicio.producto.detalles.categoria;

import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaCrearDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaEditarDTO;
import com.vhela.inventario.dto.producto.detalles.categoria.CategoriaObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;

import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;

import com.vhela.inventario.repositorio.producto.detalles.CategoriaRepositorio;
import com.vhela.inventario.repositorio.producto.ProductoRepositorio;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoriaServicioImpl implements CategoriaServicio {

    private final CategoriaRepositorio categoriaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final ProductoRepositorio productoRepositorio;

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
        aplicarReglaGanancia(
                categoria,
                dto.getTipoGanancia(),
                dto.getValorGanancia(),
                dto.getPorcentajeGanancia()
        );

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

        String tipoAnterior = obtenerTipoGanancia(categoria);
        BigDecimal valorAnterior = obtenerValorGanancia(categoria);

        aplicarReglaGanancia(
                categoria,
                dto.getTipoGanancia(),
                dto.getValorGanancia(),
                dto.getPorcentajeGanancia()
        );

        String nuevoTipo = obtenerTipoGanancia(categoria);
        BigDecimal nuevoValor = obtenerValorGanancia(categoria);
        boolean aplicarAArticulosConReglaPropia = Boolean.TRUE.equals(
                dto.getAplicarAArticulosConReglaPropia()
        );

        if ((aplicarAArticulosConReglaPropia
                || !Objects.equals(tipoAnterior, nuevoTipo)
                || !Objects.equals(valorAnterior, nuevoValor))
                && nuevoTipo != null) {
            actualizarPreciosDeLaCategoria(
                    categoria,
                    aplicarAArticulosConReglaPropia
            );
        }

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
        String tipoGanancia = obtenerTipoGanancia(categoria);
        BigDecimal valorGanancia = obtenerValorGanancia(categoria);
        dto.setTipoGanancia(tipoGanancia);
        dto.setValorGanancia(valorGanancia);
        dto.setPorcentajeGanancia(
                "PORCENTAJE".equals(tipoGanancia) ? valorGanancia : null
        );
        dto.setFechaCreacion(categoria.getFechaCreacion());

        if (categoria.getEmpresa() != null) {
            dto.setEmpresaId(categoria.getEmpresa().getId());
            dto.setEmpresaNombre(categoria.getEmpresa().getNombre());
        }

        return dto;
    }

    private void aplicarReglaGanancia(
            Categoria categoria,
            String tipoGananciaRecibido,
            BigDecimal valorGananciaRecibido,
            BigDecimal porcentajeLegado
    ) {
        String tipoGanancia = tipoGananciaRecibido == null || tipoGananciaRecibido.isBlank()
                ? (porcentajeLegado != null ? "PORCENTAJE" : null)
                : tipoGananciaRecibido.trim().toUpperCase();

        if (tipoGanancia == null && valorGananciaRecibido == null && porcentajeLegado == null) {
            categoria.setTipoGanancia(null);
            categoria.setValorGanancia(null);
            categoria.setPorcentajeGanancia(null);
            return;
        }

        if (!"PORCENTAJE".equals(tipoGanancia) && !"DINERO".equals(tipoGanancia)) {
            throw new RuntimeException("El tipo de ganancia debe ser PORCENTAJE o DINERO");
        }

        BigDecimal valor = valorGananciaRecibido != null
                ? valorGananciaRecibido
                : porcentajeLegado;

        if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El valor de ganancia es obligatorio y no puede ser negativo");
        }

        valor = valor.setScale(2, RoundingMode.HALF_UP);

        if ("PORCENTAJE".equals(tipoGanancia)
                && valor.compareTo(BigDecimal.valueOf(1000)) > 0) {
            throw new RuntimeException("El porcentaje no puede superar 1000%");
        }

        categoria.setTipoGanancia(tipoGanancia);
        categoria.setValorGanancia(valor);
        categoria.setPorcentajeGanancia(
                "PORCENTAJE".equals(tipoGanancia) ? valor : null
        );
    }

    private String obtenerTipoGanancia(Categoria categoria) {
        if (categoria.getTipoGanancia() != null && !categoria.getTipoGanancia().isBlank()) {
            return categoria.getTipoGanancia().trim().toUpperCase();
        }

        return categoria.getPorcentajeGanancia() != null ? "PORCENTAJE" : null;
    }

    private BigDecimal obtenerValorGanancia(Categoria categoria) {
        if (categoria.getValorGanancia() != null) {
            return categoria.getValorGanancia();
        }

        return categoria.getPorcentajeGanancia();
    }

    private void actualizarPreciosDeLaCategoria(
            Categoria categoria,
            boolean aplicarAArticulosConReglaPropia
    ) {
        List<Producto> productos = productoRepositorio.findByEmpresaIdAndCategoriaId(
                categoria.getEmpresa().getId(),
                categoria.getId()
        );

        productos.forEach(producto -> {
            boolean tieneReglaPropia = producto.getTipoGanancia() != null
                    && producto.getValorGanancia() != null;

            if (tieneReglaPropia && !aplicarAArticulosConReglaPropia) {
                return;
            }

            if (tieneReglaPropia) {
                producto.setTipoGanancia(null);
                producto.setValorGanancia(null);
            }

            BigDecimal costo = producto.getCostoUnitario() == null
                    ? BigDecimal.ZERO
                    : producto.getCostoUnitario();

            BigDecimal valorGanancia = obtenerValorGanancia(categoria);
            BigDecimal utilidad = "PORCENTAJE".equals(obtenerTipoGanancia(categoria))
                    ? costo.multiply(valorGanancia)
                            .divide(BigDecimal.valueOf(100), 8, RoundingMode.HALF_UP)
                    : valorGanancia;

            producto.setPrecioVenta(costo.add(utilidad).setScale(2, RoundingMode.HALF_UP));
        });

        productoRepositorio.saveAll(productos);
    }
}
