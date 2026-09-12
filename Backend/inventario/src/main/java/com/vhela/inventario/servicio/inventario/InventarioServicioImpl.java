package com.vhela.inventario.servicio.inventario;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.vhela.inventario.dto.inventario.empleado.MovimientoInventarioEmpleadoDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.inventario.AjusteInventarioDTO;
import com.vhela.inventario.dto.inventario.IngresoInventarioDTO;
import com.vhela.inventario.dto.inventario.IngresoInventarioItemDTO;
import com.vhela.inventario.dto.inventario.InventarioAdminDTO;
import com.vhela.inventario.dto.inventario.InventarioEmpleadoDTO;
import com.vhela.inventario.dto.inventario.MovimientoInventarioDTO;
import com.vhela.inventario.dto.inventario.ResumenInventarioSucursalDTO;
import com.vhela.inventario.modelo.empresa.ActividadEmpresa;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.inventario.InventarioSucursal;
import com.vhela.inventario.modelo.inventario.MovimientoInventario;
import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.empresa.ActividadEmpresaRepositorio;
import com.vhela.inventario.repositorio.inventario.InventarioSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.producto.ProductoRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class InventarioServicioImpl implements InventarioServicio {

    private final InventarioSucursalRepositorio inventarioSucursalRepositorio;
    private final MovimientoInventarioRepositorio movimientoInventarioRepositorio;
    private final ProductoRepositorio productoRepositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final ActividadEmpresaRepositorio actividadEmpresaRepositorio;

    @Override
    public void ingresarMercancia(Long usuarioId, IngresoInventarioDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoModificarInventario(usuario);

        Sucursal sucursal = obtenerSucursal(dto.getSucursalId());

        validarAccesoSucursal(usuario, sucursal);

        for (IngresoInventarioItemDTO item : dto.getItems()) {

            Producto producto = obtenerProducto(item.getProductoId());

            validarProductoPerteneceAEmpresa(producto, sucursal);

            BigDecimal precioVentaCalculado = calcularPrecioVenta(
                    item.getCostoUnitario(),
                    item.getPrecioVenta(),
                    item.getModoUtilidad(),
                    item.getValorUtilidad()
            );

            aplicarReglaUtilidadDelIngreso(producto, item);

            /*
             * Regla de negocio:
             * El último ingreso actualiza el costo y precio de venta del producto.
             * Como Producto pertenece a la empresa y es usado por todas las sucursales,
             * este nuevo costo/precio aplicará para todas las tiendas donde exista
             * esta referencia.
             *
             * Importante:
             * Solo el precio/costo se actualiza globalmente.
             * El stock solo se modifica en la sucursal donde se ingresa la mercancía.
             */
            producto.setCostoUnitario(item.getCostoUnitario());
            producto.setPrecioVenta(precioVentaCalculado);

            productoRepositorio.save(producto);

            InventarioSucursal inventario = inventarioSucursalRepositorio
                    .findBySucursalIdAndProductoId(sucursal.getId(), producto.getId())
                    .orElseGet(() -> crearInventarioInicial(sucursal, producto));

            Integer stockAntes = inventario.getStockActual();
            Integer stockDespues = stockAntes + item.getCantidad();

            inventario.setStockActual(stockDespues);

            inventarioSucursalRepositorio.save(inventario);

            registrarMovimiento(
                    TipoMovimiento.INGRESO_MERCANCIA,
                    item.getCantidad(),
                    stockAntes,
                    stockDespues,
                    dto.getMotivo(),
                    null,
                    producto,
                    sucursal,
                    usuario
            );
        }
    }

    @Override
    public void ajustarInventario(Long usuarioId, AjusteInventarioDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoModificarInventario(usuario);

        if (dto.getCantidad() == 0) {
            throw new RuntimeException("La cantidad del ajuste no puede ser cero");
        }

        Sucursal sucursal = obtenerSucursal(dto.getSucursalId());

        validarAccesoSucursal(usuario, sucursal);

        Producto producto = obtenerProducto(dto.getProductoId());

        validarProductoPerteneceAEmpresa(producto, sucursal);

        InventarioSucursal inventario = inventarioSucursalRepositorio
                .findBySucursalIdAndProductoId(sucursal.getId(), producto.getId())
                .orElseThrow(() -> new RuntimeException("El producto no tiene inventario en esta sucursal"));

        Integer stockAntes = inventario.getStockActual();
        Integer stockDespues = stockAntes + dto.getCantidad();

        if (stockDespues < 0) {
            throw new RuntimeException("El ajuste no puede dejar el inventario en negativo");
        }

        inventario.setStockActual(stockDespues);

        inventarioSucursalRepositorio.save(inventario);

        TipoMovimiento tipoMovimiento = dto.getCantidad() > 0
                ? TipoMovimiento.AJUSTE_POSITIVO
                : TipoMovimiento.AJUSTE_NEGATIVO;

        registrarMovimiento(
                tipoMovimiento,
                dto.getCantidad(),
                stockAntes,
                stockDespues,
                dto.getMotivo(),
                null,
                producto,
                sucursal,
                usuario
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> listarPorSucursal(Long usuarioId, Long sucursalId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaInventario(usuario, sucursal);

        List<InventarioSucursal> inventarios =
                inventarioSucursalRepositorio.findBySucursalId(sucursalId);

        if (usuario.getRol() == RolEnum.EMPLEADO) {
            return inventarios.stream()
                    .map(this::mapToEmpleadoDTO)
                    .toList();
        }

        return inventarios.stream()
                .map(this::mapToAdminDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenInventarioSucursalDTO obtenerResumenSucursal(Long usuarioId, Long sucursalId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoModificarInventario(usuario);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoSucursal(usuario, sucursal);

        List<InventarioSucursal> inventarios =
                inventarioSucursalRepositorio.findBySucursalId(sucursalId);

        Integer cantidadReferencias = inventarios.size();

        Integer cantidadUnidades = inventarios.stream()
                .mapToInt(InventarioSucursal::getStockActual)
                .sum();

        BigDecimal valorCostoTotal = inventarios.stream()
                .map(inv -> inv.getProducto().getCostoUnitario()
                        .multiply(BigDecimal.valueOf(inv.getStockActual())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal valorVentaTotal = inventarios.stream()
                .map(inv -> inv.getProducto().getPrecioVenta()
                        .multiply(BigDecimal.valueOf(inv.getStockActual())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        ResumenInventarioSucursalDTO dto = new ResumenInventarioSucursalDTO();
        dto.setSucursalId(sucursal.getId());
        dto.setSucursalNombre(sucursal.getNombre());
        dto.setCantidadReferencias(cantidadReferencias);
        dto.setCantidadUnidades(cantidadUnidades);
        dto.setValorCostoTotal(valorCostoTotal);
        dto.setValorVentaTotal(valorVentaTotal);
        dto.setUtilidadProyectada(valorVentaTotal.subtract(valorCostoTotal));

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoInventarioDTO> listarMovimientosPorSucursal(Long usuarioId, Long sucursalId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoModificarInventario(usuario);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoSucursal(usuario, sucursal);

        return movimientoInventarioRepositorio.findBySucursalIdOrderByFechaDesc(sucursalId)
                .stream()
                .map(this::mapToMovimientoDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimientoInventarioDTO> listarMovimientosPorEmpresa(
            Long usuarioId,
            Long empresaId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoModificarInventario(usuario);

        Empresa empresa = obtenerEmpresa(empresaId);
        validarAccesoEmpresa(usuario, empresaId);

        List<MovimientoInventarioDTO> actividades = new ArrayList<>();

        movimientoInventarioRepositorio
                .findBySucursal_Empresa_IdOrderByFechaDesc(empresa.getId())
                .stream()
                .map(this::mapToMovimientoDTO)
                .forEach(actividades::add);

        List<ActividadEmpresa> actividadesCatalogo = actividadEmpresaRepositorio
                .findByEmpresaIdOrderByFechaDesc(empresa.getId());

        actividadesCatalogo
                .stream()
                .map(this::mapToActividadDTO)
                .forEach(actividades::add);

        Set<Long> productosConActividad = new HashSet<>();
        actividadesCatalogo.forEach(actividad -> {
            if (actividad.getProducto() != null) {
                productosConActividad.add(actividad.getProducto().getId());
            }
        });

        // Compatibilidad con productos creados antes de activar esta bitácora.
        productoRepositorio.findByEmpresaId(empresa.getId())
                .stream()
                .filter(producto -> !productosConActividad.contains(producto.getId()))
                .map(this::mapProductoHistorico)
                .forEach(actividades::add);

        actividades.sort(
                Comparator.comparing(
                        MovimientoInventarioDTO::getFecha,
                        Comparator.nullsLast(Comparator.reverseOrder())
                )
        );

        return actividades;
    }

    @Override
    public MovimientoInventarioDTO revertirMovimiento(
            Long usuarioId,
            Long empresaId,
            Long movimientoId
    ) {
        Usuario usuario = obtenerUsuario(usuarioId);
        validarPermisoModificarInventario(usuario);
        validarAccesoEmpresa(usuario, empresaId);

        MovimientoInventario movimiento = movimientoInventarioRepositorio.findById(movimientoId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        if (movimiento.getSucursal() == null
                || movimiento.getSucursal().getEmpresa() == null
                || !movimiento.getSucursal().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El movimiento no pertenece a la empresa seleccionada");
        }

        if (movimiento.getTipo() == TipoMovimiento.REVERSO) {
            throw new RuntimeException("Un movimiento compensatorio no se puede revertir nuevamente");
        }

        if (Boolean.TRUE.equals(movimiento.getRevertido())) {
            throw new RuntimeException("Este movimiento ya fue revertido");
        }

        if (movimiento.getCantidad() == null || movimiento.getCantidad() == 0) {
            throw new RuntimeException("El movimiento no tiene una cantidad que pueda revertirse");
        }

        InventarioSucursal inventario = inventarioSucursalRepositorio
                .findBySucursalIdAndProductoId(
                        movimiento.getSucursal().getId(),
                        movimiento.getProducto().getId()
                )
                .orElseThrow(() -> new RuntimeException(
                        "No existe inventario actual para el producto del movimiento"
                ));

        Integer stockAntes = inventario.getStockActual();
        Integer cantidadCompensatoria = movimiento.getCantidad() * -1;
        Integer stockDespues = stockAntes + cantidadCompensatoria;

        if (stockDespues < 0) {
            throw new RuntimeException(
                    "La reversión dejaría el inventario en negativo. Ajusta primero el stock actual."
            );
        }

        inventario.setStockActual(stockDespues);
        inventarioSucursalRepositorio.save(inventario);

        MovimientoInventario reverso = new MovimientoInventario();
        reverso.setTipo(TipoMovimiento.REVERSO);
        reverso.setCantidad(cantidadCompensatoria);
        reverso.setStockAntes(stockAntes);
        reverso.setStockDespues(stockDespues);
        reverso.setMotivo("Reversión del movimiento #" + movimiento.getId());
        reverso.setReferenciaId(movimiento.getId());
        reverso.setProducto(movimiento.getProducto());
        reverso.setSucursal(movimiento.getSucursal());
        reverso.setUsuario(usuario);
        reverso.setCostoUnitarioMomento(movimiento.getCostoUnitarioMomento());
        reverso.setPrecioVentaMomento(movimiento.getPrecioVentaMomento());
        reverso.setRevertido(false);

        MovimientoInventario reversoGuardado = movimientoInventarioRepositorio.saveAndFlush(reverso);

        movimiento.setRevertido(true);
        movimiento.setMovimientoReversionId(reversoGuardado.getId());
        movimientoInventarioRepositorio.save(movimiento);

        return mapToMovimientoDTO(reversoGuardado);
    }

    private InventarioSucursal crearInventarioInicial(Sucursal sucursal, Producto producto) {

        InventarioSucursal inventario = new InventarioSucursal();

        inventario.setSucursal(sucursal);
        inventario.setProducto(producto);
        inventario.setStockActual(0);

        return inventario;
    }

    private void registrarMovimiento(
            TipoMovimiento tipo,
            Integer cantidad,
            Integer stockAntes,
            Integer stockDespues,
            String motivo,
            Long referenciaId,
            Producto producto,
            Sucursal sucursal,
            Usuario usuario
    ) {

        MovimientoInventario movimiento = new MovimientoInventario();

        movimiento.setTipo(tipo);
        movimiento.setCantidad(cantidad);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);
        movimiento.setMotivo(motivo);
        movimiento.setReferenciaId(referenciaId);

        movimiento.setProducto(producto);
        movimiento.setSucursal(sucursal);
        movimiento.setUsuario(usuario);

        /*
         * Se guarda snapshot histórico.
         * Si después cambia el precio/costo del producto,
         * este movimiento conserva el valor que tenía en este momento.
         */
        movimiento.setCostoUnitarioMomento(producto.getCostoUnitario());
        movimiento.setPrecioVentaMomento(producto.getPrecioVenta());

        movimientoInventarioRepositorio.save(movimiento);
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Empresa obtenerEmpresa(Long empresaId) {
        return empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
    }

    private Sucursal obtenerSucursal(Long sucursalId) {
        return sucursalRepositorio.findById(sucursalId)
                .orElseThrow(() -> new RuntimeException("Sucursal no encontrada"));
    }

    private Producto obtenerProducto(Long productoId) {
        return productoRepositorio.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
    }

    private void validarPermisoModificarInventario(Usuario usuario) {

        if (usuario.getRol() != RolEnum.SUPER_ADMIN &&
                usuario.getRol() != RolEnum.ADMIN) {

            throw new RuntimeException("No tiene permisos para modificar inventario");
        }
    }

    private void validarAccesoSucursal(Usuario usuario, Sucursal sucursal) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }

        if (!sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
            throw new RuntimeException("No puede operar inventario de otra empresa");
        }
    }

    private void validarAccesoEmpresa(Usuario usuario, Long empresaId) {
        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null || !usuario.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puede consultar movimientos de otra empresa");
        }
    }

    private void aplicarReglaUtilidadDelIngreso(
            Producto producto,
            IngresoInventarioItemDTO item
    ) {
        if (!Boolean.TRUE.equals(item.getReglaUtilidadModificada())) {
            return;
        }

        String modo = item.getModoUtilidad() == null
                ? ""
                : item.getModoUtilidad().trim().toUpperCase(Locale.ROOT);

        if (!"PORCENTAJE".equals(modo) && !"DINERO".equals(modo)) {
            throw new RuntimeException("El modo de utilidad debe ser PORCENTAJE o DINERO");
        }

        BigDecimal valor = item.getValorUtilidad() == null
                ? BigDecimal.ZERO
                : item.getValorUtilidad();

        producto.setTipoGanancia(modo);
        producto.setValorGanancia(valor.setScale(2, RoundingMode.HALF_UP));
    }

    private BigDecimal calcularPrecioVenta(
            BigDecimal costoUnitario,
            BigDecimal precioVentaInformado,
            String modoUtilidad,
            BigDecimal valorUtilidad
    ) {
        // Compatibilidad con ingresos antiguos que todavía no envían la regla.
        if (modoUtilidad == null || modoUtilidad.isBlank()) {
            return precioVentaInformado;
        }

        BigDecimal costo = costoUnitario == null ? BigDecimal.ZERO : costoUnitario;
        BigDecimal utilidad = valorUtilidad == null ? BigDecimal.ZERO : valorUtilidad;
        String modo = modoUtilidad.trim().toUpperCase(Locale.ROOT);

        BigDecimal precio;
        if ("PORCENTAJE".equals(modo)) {
            precio = costo.add(costo.multiply(utilidad).divide(
                    BigDecimal.valueOf(100),
                    2,
                    RoundingMode.HALF_UP
            ));
        } else if ("DINERO".equals(modo)) {
            precio = costo.add(utilidad);
        } else {
            throw new RuntimeException("El modo de utilidad debe ser PORCENTAJE o DINERO");
        }

        return precio.setScale(2, RoundingMode.HALF_UP);
    }

    private void validarAccesoConsultaInventario(Usuario usuario, Sucursal sucursal) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }

        if (!sucursal.getEmpresa().getId().equals(usuario.getEmpresa().getId())) {
            throw new RuntimeException("No puede ver inventario de otra empresa");
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {

            if (usuario.getSucursal() == null) {
                throw new RuntimeException("El empleado no tiene sucursal asignada");
            }

            if (!usuario.getSucursal().getId().equals(sucursal.getId())) {
                throw new RuntimeException("El empleado solo puede ver inventario de su sucursal");
            }
        }
    }

    private void validarProductoPerteneceAEmpresa(Producto producto, Sucursal sucursal) {

        if (!producto.getEmpresa().getId().equals(sucursal.getEmpresa().getId())) {
            throw new RuntimeException("El producto no pertenece a la empresa de la sucursal");
        }
    }

    private InventarioAdminDTO mapToAdminDTO(InventarioSucursal inventario) {

        Producto producto = inventario.getProducto();

        BigDecimal stock = BigDecimal.valueOf(inventario.getStockActual());

        BigDecimal valorCostoTotal = producto.getCostoUnitario().multiply(stock);
        BigDecimal valorVentaTotal = producto.getPrecioVenta().multiply(stock);

        InventarioAdminDTO dto = new InventarioAdminDTO();

        dto.setInventarioId(inventario.getId());

        dto.setSucursalId(inventario.getSucursal().getId());
        dto.setSucursalNombre(inventario.getSucursal().getNombre());

        dto.setProductoId(producto.getId());
        dto.setCodigo(producto.getCodigo());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setEsRemanufacturado(Boolean.TRUE.equals(producto.getEsRemanufacturado()));

        dto.setCategoria(producto.getCategoria().getNombre());
        dto.setColor(producto.getColor().getNombre());
        dto.setTalla(producto.getTalla().getNombre());
        dto.setGenero(producto.getGenero().getNombre());

        dto.setStockActual(inventario.getStockActual());

        dto.setCostoUnitario(producto.getCostoUnitario());
        dto.setPrecioVenta(producto.getPrecioVenta());

        dto.setValorCostoTotal(valorCostoTotal);
        dto.setValorVentaTotal(valorVentaTotal);
        dto.setUtilidadProyectada(valorVentaTotal.subtract(valorCostoTotal));

        return dto;
    }

    private InventarioEmpleadoDTO mapToEmpleadoDTO(InventarioSucursal inventario) {

        Producto producto = inventario.getProducto();

        BigDecimal stock = BigDecimal.valueOf(inventario.getStockActual());

        BigDecimal valorVentaTotal = producto.getPrecioVenta().multiply(stock);

        InventarioEmpleadoDTO dto = new InventarioEmpleadoDTO();

        dto.setInventarioId(inventario.getId());

        dto.setSucursalId(inventario.getSucursal().getId());
        dto.setSucursalNombre(inventario.getSucursal().getNombre());

        dto.setProductoId(producto.getId());
        dto.setCodigo(producto.getCodigo());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());

        dto.setCategoria(producto.getCategoria().getNombre());
        dto.setColor(producto.getColor().getNombre());
        dto.setTalla(producto.getTalla().getNombre());
        dto.setGenero(producto.getGenero().getNombre());

        dto.setStockActual(inventario.getStockActual());

        dto.setPrecioVenta(producto.getPrecioVenta());
        dto.setValorVentaTotal(valorVentaTotal);

        return dto;
    }

    private MovimientoInventarioDTO mapToMovimientoDTO(MovimientoInventario movimiento) {

        MovimientoInventarioDTO dto = new MovimientoInventarioDTO();

        dto.setId(movimiento.getId());
        dto.setTipo(movimiento.getTipo().name());
        dto.setOrigen("INVENTARIO");

        dto.setProductoId(movimiento.getProducto().getId());
        dto.setProductoCodigo(movimiento.getProducto().getCodigo());
        dto.setProductoNombre(movimiento.getProducto().getNombre());

        dto.setSucursalId(movimiento.getSucursal().getId());
        dto.setSucursalNombre(movimiento.getSucursal().getNombre());

        dto.setCantidad(movimiento.getCantidad());
        dto.setStockAntes(movimiento.getStockAntes());
        dto.setStockDespues(movimiento.getStockDespues());

        dto.setCostoUnitarioMomento(movimiento.getCostoUnitarioMomento());
        dto.setPrecioVentaMomento(movimiento.getPrecioVentaMomento());

        dto.setUsuarioId(movimiento.getUsuario().getId());
        dto.setUsuarioNombre(movimiento.getUsuario().getNombre());
        dto.setUsuarioRol(movimiento.getUsuario().getRol().name());

        dto.setMotivo(movimiento.getMotivo());
        dto.setReferenciaId(movimiento.getReferenciaId());

        dto.setFecha(movimiento.getFecha());
        dto.setPuedeRevertirse(
                movimiento.getTipo() != TipoMovimiento.REVERSO
                        && !Boolean.TRUE.equals(movimiento.getRevertido())
        );
        dto.setRevertido(Boolean.TRUE.equals(movimiento.getRevertido()));
        dto.setMovimientoReversionId(movimiento.getMovimientoReversionId());

        return dto;
    }

    private MovimientoInventarioDTO mapToActividadDTO(ActividadEmpresa actividad) {
        MovimientoInventarioDTO dto = new MovimientoInventarioDTO();

        // Los IDs negativos separan estas actividades de los IDs de movimientos de stock.
        dto.setId(actividad.getId() * -1);
        dto.setTipo(actividad.getTipo());
        dto.setOrigen("CATALOGO");

        if (actividad.getProducto() != null) {
            dto.setProductoId(actividad.getProducto().getId());
            dto.setProductoCodigo(actividad.getProducto().getCodigo());
            dto.setProductoNombre(actividad.getProducto().getNombre());
        }

        if (actividad.getSucursal() != null) {
            dto.setSucursalId(actividad.getSucursal().getId());
            dto.setSucursalNombre(actividad.getSucursal().getNombre());
        }

        if (actividad.getUsuario() != null) {
            dto.setUsuarioId(actividad.getUsuario().getId());
            dto.setUsuarioNombre(actividad.getUsuario().getNombre());
            dto.setUsuarioRol(actividad.getUsuario().getRol().name());
        }

        dto.setMotivo(actividad.getDescripcion());
        dto.setReferenciaId(actividad.getReferenciaId());
        dto.setFecha(actividad.getFecha());
        dto.setPuedeRevertirse(false);
        dto.setRevertido(false);

        return dto;
    }

    private MovimientoInventarioDTO mapProductoHistorico(Producto producto) {
        MovimientoInventarioDTO dto = new MovimientoInventarioDTO();

        dto.setId(-(1_000_000_000L + producto.getId()));
        dto.setTipo("PRODUCTO_CREADO");
        dto.setOrigen("CATALOGO");
        dto.setProductoId(producto.getId());
        dto.setProductoCodigo(producto.getCodigo());
        dto.setProductoNombre(producto.getNombre());
        dto.setUsuarioNombre("Sistema (histórico)");
        dto.setUsuarioRol("HISTÓRICO");
        dto.setMotivo("Referencia existente en el catálogo; no se dispone del usuario de creación.");
        dto.setReferenciaId(producto.getId());
        dto.setFecha(producto.getFechaCreacion());
        dto.setPuedeRevertirse(false);
        dto.setRevertido(false);

        return dto;
    }


    @Override
    @Transactional(readOnly = true)
    public List<MovimientoInventarioEmpleadoDTO> listarMovimientosPorSucursalEmpleado(
            Long usuarioId,
            Long sucursalId
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaInventario(usuario, sucursal);

        return movimientoInventarioRepositorio.findBySucursalIdOrderByFechaDesc(sucursalId)
                .stream()
                .map(this::mapToMovimientoEmpleadoDTO)
                .toList();
    }

    private MovimientoInventarioEmpleadoDTO mapToMovimientoEmpleadoDTO(
            MovimientoInventario movimiento
    ) {

        MovimientoInventarioEmpleadoDTO dto = new MovimientoInventarioEmpleadoDTO();

        dto.setId(movimiento.getId());

        dto.setTipo(
                movimiento.getTipo() == null
                        ? null
                        : movimiento.getTipo().name()
        );

        if (movimiento.getProducto() != null) {
            dto.setProductoId(movimiento.getProducto().getId());
            dto.setProductoCodigo(movimiento.getProducto().getCodigo());
            dto.setProductoNombre(movimiento.getProducto().getNombre());
        }

        if (movimiento.getSucursal() != null) {
            dto.setSucursalId(movimiento.getSucursal().getId());
            dto.setSucursalNombre(movimiento.getSucursal().getNombre());
        }

        dto.setCantidad(movimiento.getCantidad());
        dto.setStockAntes(movimiento.getStockAntes());
        dto.setStockDespues(movimiento.getStockDespues());

        /*
         * El empleado puede ver el precio de venta,
         * pero nunca el costo del producto.
         */
        dto.setPrecioVentaMomento(movimiento.getPrecioVentaMomento());

        if (movimiento.getUsuario() != null) {
            dto.setUsuarioId(movimiento.getUsuario().getId());
            dto.setUsuarioNombre(movimiento.getUsuario().getNombre());
            dto.setUsuarioRol(movimiento.getUsuario().getRol().name());
        }

        dto.setMotivo(movimiento.getMotivo());
        dto.setReferenciaId(movimiento.getReferenciaId());
        dto.setFecha(movimiento.getFecha());

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventarioEmpleadoDTO> listarInventarioPorSucursalEmpleado(
            Long usuarioId,
            Long sucursalId
    ) {

        Usuario empleado = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (empleado.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Solo empleados pueden consultar este inventario");
        }

        if (empleado.getSucursal() == null) {
            throw new RuntimeException("El empleado no tiene sucursal asignada");
        }

        if (!empleado.getSucursal().getId().equals(sucursalId)) {
            throw new RuntimeException("No puedes consultar inventario de otra sucursal");
        }

        return inventarioSucursalRepositorio.findBySucursalId(sucursalId)
                .stream()
                .map(this::mapToInventarioEmpleadoDTO)
                .toList();
    }

    private InventarioEmpleadoDTO mapToInventarioEmpleadoDTO(
            InventarioSucursal inventario
    ) {

        InventarioEmpleadoDTO dto = new InventarioEmpleadoDTO();



        dto.setProductoId(inventario.getProducto().getId());
        dto.setCodigo(inventario.getProducto().getCodigo());
        dto.setNombre(inventario.getProducto().getNombre());
        dto.setDescripcion(inventario.getProducto().getDescripcion());

        dto.setCategoria(
                inventario.getProducto().getCategoria() != null
                        ? inventario.getProducto().getCategoria().getNombre()
                        : null
        );

        dto.setColor(
                inventario.getProducto().getColor() != null
                        ? inventario.getProducto().getColor().getNombre()
                        : null
        );

        dto.setTalla(
                inventario.getProducto().getTalla() != null
                        ? inventario.getProducto().getTalla().getNombre()
                        : null
        );

        dto.setGenero(
                inventario.getProducto().getGenero() != null
                        ? inventario.getProducto().getGenero().getNombre()
                        : null
        );

        dto.setStockActual(inventario.getStockActual());
        dto.setPrecioVenta(inventario.getProducto().getPrecioVenta());

        dto.setSucursalId(inventario.getSucursal().getId());
        dto.setSucursalNombre(inventario.getSucursal().getNombre());

        return dto;
    }


}
