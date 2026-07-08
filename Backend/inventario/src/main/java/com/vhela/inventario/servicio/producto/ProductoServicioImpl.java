package com.vhela.inventario.servicio.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEmpleadoObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.producto.detalles.Color;
import com.vhela.inventario.modelo.producto.detalles.Genero;
import com.vhela.inventario.modelo.producto.detalles.Talla;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.inventario.InventarioSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.producto.ProductoRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.CategoriaRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.ColorRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.GeneroRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.TallaRepositorio;
import com.vhela.inventario.repositorio.venta.DetalleFacturaVentaRepositorio;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductoServicioImpl implements ProductoServicio {

    private final ProductoRepositorio productoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;

    private final ColorRepositorio colorRepositorio;
    private final CategoriaRepositorio categoriaRepositorio;
    private final TallaRepositorio tallaRepositorio;
    private final GeneroRepositorio generoRepositorio;

    private final InventarioSucursalRepositorio inventarioSucursalRepositorio;
    private final MovimientoInventarioRepositorio movimientoInventarioRepositorio;
    private final DetalleFacturaVentaRepositorio detalleFacturaVentaRepositorio;

    @Override
    public ProductoAdminObtenerDTO crear(Long usuarioId, ProductoCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String codigoNormalizado = normalizarTexto(dto.getCodigo());

        if (productoRepositorio.existsByCodigoAndEmpresaId(codigoNormalizado, empresa.getId())) {
            throw new RuntimeException("Ya existe un producto con ese código en la empresa");
        }

        Color color = colorRepositorio.findById(dto.getColorId())
                .orElseThrow(() -> new RuntimeException("Color no encontrado"));

        Categoria categoria = categoriaRepositorio.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        Talla talla = tallaRepositorio.findById(dto.getTallaId())
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        Genero genero = generoRepositorio.findById(dto.getGeneroId())
                .orElseThrow(() -> new RuntimeException("Género no encontrado"));

        validarDetallePerteneceAEmpresa(
                color.getEmpresa().getId(),
                empresa.getId(),
                "El color no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                categoria.getEmpresa().getId(),
                empresa.getId(),
                "La categoría no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                talla.getEmpresa().getId(),
                empresa.getId(),
                "La talla no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                genero.getEmpresa().getId(),
                empresa.getId(),
                "El género no pertenece a la empresa"
        );

        Producto producto = new Producto();

        producto.setNombre(normalizarTexto(dto.getNombre()));
        producto.setCodigo(codigoNormalizado);
        producto.setDescripcion(normalizarTexto(dto.getDescripcion()));
        producto.setEmpresa(empresa);
        producto.setColor(color);
        producto.setCategoria(categoria);
        producto.setTalla(talla);
        producto.setGenero(genero);

        producto.setCostoUnitario(BigDecimal.ZERO);
        producto.setPrecioVenta(BigDecimal.ZERO);

        Producto guardado = productoRepositorio.save(producto);

        return mapToAdminDTO(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return productoRepositorio.findAll()
                    .stream()
                    .map(this::mapToAdminDTO)
                    .toList();
        }

        validarUsuarioConEmpresa(usuario);

        if (usuario.getRol() == RolEnum.ADMIN) {
            return productoRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToAdminDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            return productoRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToEmpleadoDTO)
                    .toList();
        }

        throw new RuntimeException("Rol no permitido");
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> listarPorEmpresa(Long usuarioId, Long empresaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        validarAccesoAEmpresa(usuario, empresa.getId());

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            return productoRepositorio.findByEmpresaId(empresa.getId())
                    .stream()
                    .map(this::mapToEmpleadoDTO)
                    .toList();
        }

        return productoRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .map(this::mapToAdminDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Object obtenerPorId(Long usuarioId, Long productoId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            return mapToEmpleadoDTO(producto);
        }

        return mapToAdminDTO(producto);
    }

    @Override
    public ProductoAdminObtenerDTO editar(Long usuarioId, Long productoId, ProductoEditarDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        if (productoTieneRegistrosVinculados(producto.getId())) {
            throw new RuntimeException(
                    "No se puede editar este producto porque tiene inventario, movimientos o ventas vinculadas"
            );
        }

        Color color = colorRepositorio.findById(dto.getColorId())
                .orElseThrow(() -> new RuntimeException("Color no encontrado"));

        Categoria categoria = categoriaRepositorio.findById(dto.getCategoriaId())
                .orElseThrow(() -> new RuntimeException("Categoría no encontrada"));

        Talla talla = tallaRepositorio.findById(dto.getTallaId())
                .orElseThrow(() -> new RuntimeException("Talla no encontrada"));

        Genero genero = generoRepositorio.findById(dto.getGeneroId())
                .orElseThrow(() -> new RuntimeException("Género no encontrado"));

        Long empresaIdProducto = producto.getEmpresa().getId();

        validarDetallePerteneceAEmpresa(
                color.getEmpresa().getId(),
                empresaIdProducto,
                "El color no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                categoria.getEmpresa().getId(),
                empresaIdProducto,
                "La categoría no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                talla.getEmpresa().getId(),
                empresaIdProducto,
                "La talla no pertenece a la empresa"
        );

        validarDetallePerteneceAEmpresa(
                genero.getEmpresa().getId(),
                empresaIdProducto,
                "El género no pertenece a la empresa"
        );

        producto.setNombre(normalizarTexto(dto.getNombre()));
        producto.setDescripcion(normalizarTexto(dto.getDescripcion()));
        producto.setColor(color);
        producto.setCategoria(categoria);
        producto.setTalla(talla);
        producto.setGenero(genero);

        Producto actualizado = productoRepositorio.save(producto);

        return mapToAdminDTO(actualizado);
    }

    @Override
    public void eliminar(Long usuarioId, Long productoId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        if (productoTieneRegistrosVinculados(producto.getId())) {
            throw new RuntimeException(
                    "No se puede eliminar este producto porque tiene inventario, movimientos o ventas vinculadas"
            );
        }

        productoRepositorio.delete(producto);
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarPermisoGestionProducto(Usuario usuario) {

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            throw new RuntimeException("EMPLEADO no puede gestionar productos");
        }

        if (usuario.getRol() != RolEnum.SUPER_ADMIN &&
                usuario.getRol() != RolEnum.ADMIN) {
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

            validarUsuarioConEmpresa(usuario);

            if (!usuario.getEmpresa().getId().equals(empresaIdDTO)) {
                throw new RuntimeException("ADMIN no puede crear productos en otra empresa");
            }

            return empresa;
        }

        throw new RuntimeException("No tienes permisos para definir empresa");
    }

    private void validarAccesoAEmpresa(Usuario usuario, Long empresaId) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        validarUsuarioConEmpresa(usuario);

        if (!usuario.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puedes acceder a productos de otra empresa");
        }
    }

    private void validarUsuarioConEmpresa(Usuario usuario) {

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }
    }

    private void validarDetallePerteneceAEmpresa(
            Long detalleEmpresaId,
            Long empresaIdProducto,
            String mensaje
    ) {

        if (!detalleEmpresaId.equals(empresaIdProducto)) {
            throw new RuntimeException(mensaje);
        }
    }

    private boolean productoTieneRegistrosVinculados(Long productoId) {

        boolean tieneInventario = inventarioSucursalRepositorio
                .existsByProductoId(productoId);

        boolean tieneMovimientos = movimientoInventarioRepositorio
                .existsByProductoId(productoId);

        boolean tieneVentas = detalleFacturaVentaRepositorio
                .existsByProductoId(productoId);

        return tieneInventario || tieneMovimientos || tieneVentas;
    }

    private String normalizarTexto(String texto) {

        if (texto == null || texto.isBlank()) {
            throw new RuntimeException("El texto no puede estar vacío");
        }

        return texto.trim();
    }

    private ProductoAdminObtenerDTO mapToAdminDTO(Producto producto) {

        ProductoAdminObtenerDTO dto = new ProductoAdminObtenerDTO();

        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setCodigo(producto.getCodigo());
        dto.setDescripcion(producto.getDescripcion());

        dto.setEmpresaId(producto.getEmpresa().getId());
        dto.setEmpresaNombre(producto.getEmpresa().getNombre());

        dto.setColorId(producto.getColor().getId());
        dto.setColorNombre(producto.getColor().getNombre());

        dto.setCategoriaId(producto.getCategoria().getId());
        dto.setCategoriaNombre(producto.getCategoria().getNombre());

        dto.setTallaId(producto.getTalla().getId());
        dto.setTallaNombre(producto.getTalla().getNombre());

        dto.setGeneroId(producto.getGenero().getId());
        dto.setGeneroNombre(producto.getGenero().getNombre());

        dto.setCostoUnitario(producto.getCostoUnitario());
        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setFechaCreacion(producto.getFechaCreacion());

        boolean bloqueado = productoTieneRegistrosVinculados(producto.getId());

        dto.setPuedeModificar(!bloqueado);

        dto.setMotivoBloqueo(
                bloqueado
                        ? "Producto bloqueado porque tiene inventario, movimientos o ventas vinculadas"
                        : null
        );

        return dto;
    }

    private ProductoEmpleadoObtenerDTO mapToEmpleadoDTO(Producto producto) {

        ProductoEmpleadoObtenerDTO dto = new ProductoEmpleadoObtenerDTO();

        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setCodigo(producto.getCodigo());
        dto.setDescripcion(producto.getDescripcion());

        dto.setEmpresaId(producto.getEmpresa().getId());
        dto.setEmpresaNombre(producto.getEmpresa().getNombre());

        dto.setColorId(producto.getColor().getId());
        dto.setColorNombre(producto.getColor().getNombre());

        dto.setCategoriaId(producto.getCategoria().getId());
        dto.setCategoriaNombre(producto.getCategoria().getNombre());

        dto.setTallaId(producto.getTalla().getId());
        dto.setTallaNombre(producto.getTalla().getNombre());

        dto.setGeneroId(producto.getGenero().getId());
        dto.setGeneroNombre(producto.getGenero().getNombre());

        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setFechaCreacion(producto.getFechaCreacion());

        return dto;
    }
}