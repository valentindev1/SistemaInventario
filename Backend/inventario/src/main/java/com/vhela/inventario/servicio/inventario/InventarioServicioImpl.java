package com.vhela.inventario.servicio.inventario;

import java.math.BigDecimal;
import java.util.List;

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
import com.vhela.inventario.modelo.inventario.InventarioSucursal;
import com.vhela.inventario.modelo.inventario.MovimientoInventario;
import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
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

    @Override
    public void ingresarMercancia(Long usuarioId, IngresoInventarioDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoModificarInventario(usuario);

        Sucursal sucursal = obtenerSucursal(dto.getSucursalId());

        validarAccesoSucursal(usuario, sucursal);

        for (IngresoInventarioItemDTO item : dto.getItems()) {

            Producto producto = obtenerProducto(item.getProductoId());

            validarProductoPerteneceAEmpresa(producto, sucursal);

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
            producto.setPrecioVenta(item.getPrecioVenta());

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