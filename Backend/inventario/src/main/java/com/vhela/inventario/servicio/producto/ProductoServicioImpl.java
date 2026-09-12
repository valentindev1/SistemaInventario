package com.vhela.inventario.servicio.producto;

import com.vhela.inventario.dto.producto.producto.ProductoAdminObtenerDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoManualDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarCostoProductoDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarPrecioVentaDTO;
import com.vhela.inventario.dto.producto.producto.ActualizarReglaGananciaDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCostoDetalleCrearDTO;
import com.vhela.inventario.dto.producto.producto.ProductoCostoDetalleDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEditarDTO;
import com.vhela.inventario.dto.producto.producto.ProductoEmpleadoObtenerDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.empresa.ActividadEmpresa;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.producto.AtributoCosto;
import com.vhela.inventario.modelo.producto.ProductoCostoDetalle;
import com.vhela.inventario.modelo.producto.detalles.Categoria;
import com.vhela.inventario.modelo.producto.detalles.Color;
import com.vhela.inventario.modelo.producto.detalles.Genero;
import com.vhela.inventario.modelo.producto.detalles.Talla;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.empresa.ActividadEmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.inventario.InventarioSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.producto.ProductoRepositorio;
import com.vhela.inventario.repositorio.producto.AtributoCostoRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.CategoriaRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.ColorRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.GeneroRepositorio;
import com.vhela.inventario.repositorio.producto.detalles.TallaRepositorio;
import com.vhela.inventario.repositorio.venta.DetalleFacturaVentaRepositorio;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductoServicioImpl implements ProductoServicio {

    private final ProductoRepositorio productoRepositorio;
    private final AtributoCostoRepositorio atributoCostoRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final ActividadEmpresaRepositorio actividadEmpresaRepositorio;

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

        String tipoCosto = resolverTipoCosto(dto);
        producto.setTipoCosto(tipoCosto);
        producto.setEsRemanufacturado(
                "MANUAL".equals(tipoCosto)
                        && (dto.getEsRemanufacturado() == null
                        || Boolean.TRUE.equals(dto.getEsRemanufacturado()))
        );
        producto.setCostoPersonalizado(Boolean.TRUE.equals(dto.getCostoPersonalizado()));

        if (Boolean.TRUE.equals(producto.getCostoPersonalizado())
                && !"DESGLOSE".equals(producto.getTipoCosto())) {
            throw new RuntimeException(
                    "Un producto personalizado debe registrar su costo mediante un desglose"
            );
        }

        producto.setCostoUnitario(prepararCosto(producto, dto));
        producto.setPrecioVenta(BigDecimal.ZERO);

        Producto guardado = productoRepositorio.save(producto);

        registrarActividadCreacion(usuario, empresa, guardado);

        return mapToAdminDTO(guardado);
    }

    private String resolverTipoCosto(ProductoCrearDTO dto) {
        if (dto.getTipoCosto() == null || dto.getTipoCosto().isBlank()) {
            return dto.getDesgloseCosto() != null && !dto.getDesgloseCosto().isEmpty()
                    ? "DESGLOSE"
                    : "MANUAL";
        }

        return resolverTipoCosto(dto.getTipoCosto());
    }

    private String resolverTipoCosto(String tipo) {
        String tipoRecibido = tipo == null
                ? ""
                : tipo.trim().toUpperCase(Locale.ROOT);

        if (tipoRecibido.isBlank()) {
            return "MANUAL";
        }

        if (!"MANUAL".equals(tipoRecibido) && !"DESGLOSE".equals(tipoRecibido)) {
            throw new RuntimeException("El tipo de costo debe ser MANUAL o DESGLOSE");
        }

        return tipoRecibido;
    }

    private BigDecimal prepararCosto(Producto producto, ProductoCrearDTO dto) {
        String tipoCosto = producto.getTipoCosto();

        if ("MANUAL".equals(tipoCosto)) {
            if (dto.getDesgloseCosto() != null && !dto.getDesgloseCosto().isEmpty()) {
                throw new RuntimeException(
                        "No se pueden enviar componentes de costo cuando el tipo es MANUAL"
                );
            }

            return normalizarMonto(dto.getCostoUnitario());
        }

        List<ProductoCostoDetalleCrearDTO> componentes = dto.getDesgloseCosto();

        if (componentes == null || componentes.isEmpty()) {
            throw new RuntimeException(
                    "Debes agregar al menos un componente para calcular el costo por desglose"
            );
        }

        return prepararCostoPorComponentes(producto, componentes);
    }

    private BigDecimal prepararCostoPorComponentes(
            Producto producto,
            List<ProductoCostoDetalleCrearDTO> componentes
    ) {
        Set<String> conceptosUsados = new HashSet<>();
        BigDecimal total = BigDecimal.ZERO;

        for (int indice = 0; indice < componentes.size(); indice++) {
            ProductoCostoDetalleCrearDTO componente = componentes.get(indice);
            AtributoCosto atributoCosto = null;
            String concepto;

            if (componente.getAtributoCostoId() != null) {
                atributoCosto = atributoCostoRepositorio.findById(componente.getAtributoCostoId())
                        .orElseThrow(() -> new RuntimeException(
                                "El atributo de costo seleccionado no existe"
                        ));

                if (!Boolean.TRUE.equals(atributoCosto.getActivo())) {
                    throw new RuntimeException(
                            "El atributo de costo seleccionado está inactivo"
                    );
                }

                if (!atributoCosto.getEmpresa().getId().equals(producto.getEmpresa().getId())
                        || !atributoCosto.getCategoria().getId().equals(producto.getCategoria().getId())) {
                    throw new RuntimeException(
                            "El atributo de costo no pertenece a la categoría seleccionada"
                    );
                }

                concepto = atributoCosto.getNombre();
            } else {
                // Compatibilidad con productos enviados por clientes anteriores.
                concepto = normalizarTexto(componente.getConcepto());
            }

            BigDecimal valor = normalizarMonto(componente.getValor());

            if (valor.compareTo(BigDecimal.ZERO) <= 0) {
                throw new RuntimeException(
                        "El valor del componente \"" + concepto + "\" debe ser mayor que cero"
                );
            }

            if (!conceptosUsados.add(concepto.toLowerCase(Locale.ROOT))) {
                throw new RuntimeException(
                        "No puedes repetir el componente de costo \"" + concepto + "\""
                );
            }

            ProductoCostoDetalle detalle = new ProductoCostoDetalle();
            detalle.setAtributoCostoId(
                    atributoCosto == null ? null : atributoCosto.getId()
            );
            detalle.setConcepto(concepto);
            detalle.setValor(valor);
            detalle.setOrden(indice);
            detalle.setProducto(producto);
            producto.getDesgloseCosto().add(detalle);

            total = total.add(valor);
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizarMonto(BigDecimal monto) {
        if (monto == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        if (monto.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("El valor no puede ser negativo");
        }

        return monto.setScale(2, RoundingMode.HALF_UP);
    }

    private void registrarActividadCreacion(
            Usuario usuario,
            Empresa empresa,
            Producto producto
    ) {
        registrarActividad(
                usuario,
                empresa,
                producto,
                "PRODUCTO_CREADO",
                "Producto creado en el catálogo: " + producto.getCodigo()
        );
    }

    private void registrarActividad(
            Usuario usuario,
            Empresa empresa,
            Producto producto,
            String tipo,
            String descripcion
    ) {
        ActividadEmpresa actividad = new ActividadEmpresa();
        actividad.setTipo(tipo);
        actividad.setDescripcion(descripcion);
        actividad.setReferenciaId(producto.getId());
        actividad.setEmpresa(empresa);
        actividad.setProducto(producto);
        actividad.setUsuario(usuario);
        actividadEmpresaRepositorio.save(actividad);
    }

    private String formatearReglaGanancia(String tipo, BigDecimal valor) {
        if (tipo == null || valor == null) {
            return "heredada de la categoría";
        }

        return tipo + " " + valor;
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

        registrarActividad(
                usuario,
                actualizado.getEmpresa(),
                actualizado,
                "PRODUCTO_ACTUALIZADO",
                "Datos del producto actualizados en el catálogo: " + actualizado.getCodigo()
        );

        return mapToAdminDTO(actualizado);
    }

    @Override
    public ProductoAdminObtenerDTO actualizarPrecioVenta(
            Long usuarioId,
            Long productoId,
            ActualizarPrecioVentaDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        BigDecimal costoAnterior = producto.getCostoUnitario();
        BigDecimal precioAnterior = producto.getPrecioVenta();

        if (dto.getCostoUnitario() != null) {
            producto.setCostoUnitario(dto.getCostoUnitario());
        }

        if (dto.getTipoGanancia() != null || dto.getValorGanancia() != null) {
            String tipoGanancia = dto.getTipoGanancia() == null
                    ? ""
                    : dto.getTipoGanancia().trim().toUpperCase();
            BigDecimal valorGanancia = dto.getValorGanancia();

            if (!"PORCENTAJE".equals(tipoGanancia) && !"DINERO".equals(tipoGanancia)) {
                throw new RuntimeException("El tipo de ganancia debe ser PORCENTAJE o DINERO");
            }

            if (valorGanancia == null || valorGanancia.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("El valor de ganancia es obligatorio y no puede ser negativo");
            }

            valorGanancia = valorGanancia.setScale(2, RoundingMode.HALF_UP);

            if ("PORCENTAJE".equals(tipoGanancia)
                    && valorGanancia.compareTo(BigDecimal.valueOf(1000)) > 0) {
                throw new RuntimeException("El porcentaje no puede superar 1000%");
            }

            producto.setTipoGanancia(tipoGanancia);
            producto.setValorGanancia(valorGanancia);
        }

        producto.setPrecioVenta(dto.getPrecioVenta());

        Producto actualizado = productoRepositorio.save(producto);

        registrarActividad(
                usuario,
                actualizado.getEmpresa(),
                actualizado,
                "PRECIO_ACTUALIZADO",
                "Costo/precio actualizados: costo " + costoAnterior
                        + " → " + actualizado.getCostoUnitario()
                        + ", precio " + precioAnterior
                        + " → " + actualizado.getPrecioVenta()
        );

        return mapToAdminDTO(actualizado);
    }

    @Override
    public ProductoAdminObtenerDTO actualizarCostoManual(
            Long usuarioId,
            Long productoId,
            ActualizarCostoManualDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        if ("DESGLOSE".equalsIgnoreCase(producto.getTipoCosto())
                || (producto.getDesgloseCosto() != null && !producto.getDesgloseCosto().isEmpty())) {
            throw new RuntimeException(
                    "Este producto calcula su costo mediante atributos; debes modificar su desglose"
            );
        }

        BigDecimal costoAnterior = producto.getCostoUnitario();
        BigDecimal costoNuevo = normalizarMonto(dto.getCostoUnitario());

        producto.setTipoCosto("MANUAL");
        producto.setEsRemanufacturado(
                dto.getEsRemanufacturado() == null
                        || Boolean.TRUE.equals(dto.getEsRemanufacturado())
        );
        producto.setCostoPersonalizado(false);
        producto.setCostoUnitario(costoNuevo);

        Producto actualizado = productoRepositorio.save(producto);

        registrarActividad(
                usuario,
                actualizado.getEmpresa(),
                actualizado,
                "COSTO_MANUAL_ACTUALIZADO",
                "Costo manual actualizado de " + costoAnterior + " a " + costoNuevo
                        + " para el producto " + actualizado.getCodigo()
        );

        return mapToAdminDTO(actualizado);
    }

    @Override
    public ProductoAdminObtenerDTO actualizarCosto(
            Long usuarioId,
            Long productoId,
            ActualizarCostoProductoDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        String tipoCosto = resolverTipoCosto(dto.getTipoCosto());
        BigDecimal costoAnterior = producto.getCostoUnitario();
        BigDecimal costoNuevo;

        if ("MANUAL".equals(tipoCosto)) {
            costoNuevo = normalizarMonto(dto.getCostoUnitario());
            producto.getDesgloseCosto().clear();
        } else {
            List<ProductoCostoDetalleCrearDTO> componentes = dto.getDesgloseCosto();

            if (componentes == null || componentes.isEmpty()) {
                throw new RuntimeException(
                        "Debes agregar al menos un atributo para calcular el costo por desglose"
                );
            }

            producto.getDesgloseCosto().clear();
            costoNuevo = prepararCostoPorComponentes(producto, componentes);
        }

        producto.setTipoCosto(tipoCosto);
        producto.setEsRemanufacturado(
                "MANUAL".equals(tipoCosto)
                        && (dto.getEsRemanufacturado() == null
                        || Boolean.TRUE.equals(dto.getEsRemanufacturado()))
        );
        producto.setCostoUnitario(costoNuevo);

        Producto actualizado = productoRepositorio.save(producto);

        registrarActividad(
                usuario,
                actualizado.getEmpresa(),
                actualizado,
                "COSTO_ACTUALIZADO",
                "Costo " + tipoCosto.toLowerCase(Locale.ROOT) + " actualizado de "
                        + costoAnterior + " a " + costoNuevo
                        + " para el producto " + actualizado.getCodigo()
        );

        return mapToAdminDTO(actualizado);
    }

    @Override
    public ProductoAdminObtenerDTO actualizarReglaGanancia(
            Long usuarioId,
            Long productoId,
            ActualizarReglaGananciaDTO dto
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoGestionProducto(usuario);

        Producto producto = productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarAccesoAEmpresa(usuario, producto.getEmpresa().getId());

        String tipoGananciaAnterior = producto.getTipoGanancia();
        BigDecimal valorGananciaAnterior = producto.getValorGanancia();

        String tipoGanancia = dto.getTipoGanancia();
        BigDecimal valorGanancia = dto.getValorGanancia();

        if (tipoGanancia == null || tipoGanancia.isBlank()) {
            if (valorGanancia != null) {
                throw new RuntimeException("El tipo de ganancia es obligatorio");
            }

            producto.setTipoGanancia(null);
            producto.setValorGanancia(null);
            aplicarReglaDeCategoria(producto);
        } else {
            tipoGanancia = tipoGanancia.trim().toUpperCase();

            if (!"PORCENTAJE".equals(tipoGanancia) && !"DINERO".equals(tipoGanancia)) {
                throw new RuntimeException("El tipo de ganancia debe ser PORCENTAJE o DINERO");
            }

            if (valorGanancia == null || valorGanancia.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("El valor de ganancia es obligatorio y no puede ser negativo");
            }

            valorGanancia = valorGanancia.setScale(2, java.math.RoundingMode.HALF_UP);

            if ("PORCENTAJE".equals(tipoGanancia)
                    && valorGanancia.compareTo(BigDecimal.valueOf(1000)) > 0) {
                throw new RuntimeException("El porcentaje no puede superar 1000%");
            }

            producto.setTipoGanancia(tipoGanancia);
            producto.setValorGanancia(valorGanancia);

            BigDecimal costo = producto.getCostoUnitario() == null
                    ? BigDecimal.ZERO
                    : producto.getCostoUnitario();
            BigDecimal utilidad = "PORCENTAJE".equals(tipoGanancia)
                    ? costo.multiply(valorGanancia)
                            .divide(BigDecimal.valueOf(100), 8, java.math.RoundingMode.HALF_UP)
                    : valorGanancia;

            producto.setPrecioVenta(costo.add(utilidad).setScale(2, java.math.RoundingMode.HALF_UP));
        }

        Producto actualizado = productoRepositorio.save(producto);

        registrarActividad(
                usuario,
                actualizado.getEmpresa(),
                actualizado,
                "REGLA_UTILIDAD_ACTUALIZADA",
                "Regla de utilidad actualizada de "
                        + formatearReglaGanancia(tipoGananciaAnterior, valorGananciaAnterior)
                        + " a "
                        + formatearReglaGanancia(actualizado.getTipoGanancia(), actualizado.getValorGanancia())
        );

        return mapToAdminDTO(actualizado);
    }

    private void aplicarReglaDeCategoria(Producto producto) {

        Categoria categoria = producto.getCategoria();
        String tipoGanancia = categoria.getTipoGanancia();
        BigDecimal valorGanancia = categoria.getValorGanancia();

        if (tipoGanancia == null && categoria.getPorcentajeGanancia() != null) {
            tipoGanancia = "PORCENTAJE";
            valorGanancia = categoria.getPorcentajeGanancia();
        }

        if (tipoGanancia == null || valorGanancia == null) {
            return;
        }

        BigDecimal costo = producto.getCostoUnitario() == null
                ? BigDecimal.ZERO
                : producto.getCostoUnitario();
        BigDecimal utilidad = "PORCENTAJE".equals(tipoGanancia)
                ? costo.multiply(valorGanancia)
                        .divide(BigDecimal.valueOf(100), 8, java.math.RoundingMode.HALF_UP)
                : valorGanancia;

        producto.setPrecioVenta(costo.add(utilidad).setScale(2, java.math.RoundingMode.HALF_UP));
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
        String tipoGanancia = producto.getCategoria().getTipoGanancia();
        if (tipoGanancia == null && producto.getCategoria().getPorcentajeGanancia() != null) {
            tipoGanancia = "PORCENTAJE";
        }
        dto.setCategoriaTipoGanancia(tipoGanancia);
        dto.setCategoriaValorGanancia(
                producto.getCategoria().getValorGanancia() != null
                        ? producto.getCategoria().getValorGanancia()
                        : producto.getCategoria().getPorcentajeGanancia()
        );
        dto.setCategoriaPorcentajeGanancia(producto.getCategoria().getPorcentajeGanancia());
        dto.setTipoGananciaProducto(producto.getTipoGanancia());
        dto.setValorGananciaProducto(producto.getValorGanancia());

        dto.setTallaId(producto.getTalla().getId());
        dto.setTallaNombre(producto.getTalla().getNombre());

        dto.setGeneroId(producto.getGenero().getId());
        dto.setGeneroNombre(producto.getGenero().getNombre());

        dto.setTipoCosto(
                producto.getTipoCosto() == null || producto.getTipoCosto().isBlank()
                        ? "MANUAL"
                        : producto.getTipoCosto()
        );
        boolean costoManual = "MANUAL".equalsIgnoreCase(dto.getTipoCosto());
        dto.setEsRemanufacturado(
                costoManual
                        && (producto.getEsRemanufacturado() == null
                        || Boolean.TRUE.equals(producto.getEsRemanufacturado()))
        );
        dto.setCostoPersonalizado(Boolean.TRUE.equals(producto.getCostoPersonalizado()));
        dto.setDesgloseCosto(producto.getDesgloseCosto() == null
                ? List.of()
                : producto.getDesgloseCosto().stream()
                        .map(this::mapToCostoDetalleDTO)
                        .toList());
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

    private ProductoCostoDetalleDTO mapToCostoDetalleDTO(ProductoCostoDetalle detalle) {
        ProductoCostoDetalleDTO dto = new ProductoCostoDetalleDTO();
        dto.setId(detalle.getId());
        dto.setAtributoCostoId(detalle.getAtributoCostoId());
        dto.setConcepto(detalle.getConcepto());
        dto.setValor(detalle.getValor());
        dto.setOrden(detalle.getOrden());
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
