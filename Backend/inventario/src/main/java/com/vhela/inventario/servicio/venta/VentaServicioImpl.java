package com.vhela.inventario.servicio.venta;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

import com.vhela.inventario.dto.producto.producto.ProductoRankingVentasDTO;
import com.vhela.inventario.dto.producto.producto.RankingProductosVentasDTO;
import com.vhela.inventario.dto.venta.*;

import com.vhela.inventario.dto.venta.empleado.venta.DetalleFacturaVentaEmpleadoDTO;
import com.vhela.inventario.dto.venta.empleado.venta.FacturaVentaEmpleadoDTO;
import com.vhela.inventario.dto.venta.empleado.venta.VentaHistorialEmpleadoDTO;
import com.vhela.inventario.modelo.cliente.Cliente;
import com.vhela.inventario.modelo.inventario.InventarioSucursal;
import com.vhela.inventario.modelo.inventario.MovimientoInventario;
import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.producto.Producto;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.modelo.ventas.DetalleVenta;
import com.vhela.inventario.modelo.ventas.EstadoFactura;
import com.vhela.inventario.modelo.ventas.Venta;

import com.vhela.inventario.repositorio.ClienteRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.inventario.InventarioSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.producto.ProductoRepositorio;
import com.vhela.inventario.repositorio.venta.FacturaVentaRepositorio;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class VentaServicioImpl implements VentaServicio {

    private final FacturaVentaRepositorio facturaVentaRepositorio;

    private final InventarioSucursalRepositorio inventarioSucursalRepositorio;
    private final MovimientoInventarioRepositorio movimientoInventarioRepositorio;

    private final ProductoRepositorio productoRepositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final ClienteRepositorio clienteRepositorio;

    @Override
    public FacturaVentaDTO crearVenta(Long usuarioId, CrearVentaDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(dto.getSucursalId());

        validarAccesoVenta(usuario, sucursal);

        Cliente cliente = obtenerCliente(dto.getClienteId());

        validarClientePerteneceAEmpresa(
                cliente,
                sucursal.getEmpresa().getId()
        );

        Map<Long, Integer> productosAgrupados = agruparProductos(dto.getItems());

        validarProductosYStock(productosAgrupados, sucursal);

        BigDecimal descuento = dto.getDescuento() == null
                ? BigDecimal.ZERO
                : dto.getDescuento();

        if (descuento.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "El descuento no puede ser negativo"
            );
        }

        Venta venta = new Venta();
        venta.setNumeroVenta(generarNumeroVenta(sucursal));
        venta.setEmpresa(sucursal.getEmpresa());
        venta.setSucursal(sucursal);
        venta.setUsuario(usuario);
        venta.setCliente(cliente);
        venta.setEstado(EstadoFactura.ACTIVA);
        venta.setObservacion(dto.getObservacion());

        venta.setDescuento(descuento);
        venta.setSubtotal(BigDecimal.ZERO);
        venta.setTotal(BigDecimal.ZERO);

        Venta ventaGuardada = facturaVentaRepositorio.save(venta);

        BigDecimal subtotalVenta = BigDecimal.ZERO;

        List<DetalleVenta> detalles = new ArrayList<>();

        for (Map.Entry<Long, Integer> entry : productosAgrupados.entrySet()) {

            Long productoId = entry.getKey();
            Integer cantidadVendida = entry.getValue();

            Producto producto = obtenerProducto(productoId);

            validarProductoPerteneceAEmpresa(
                    producto,
                    sucursal.getEmpresa().getId()
            );

            InventarioSucursal inventario = obtenerInventario(
                    sucursal.getId(),
                    producto.getId()
            );

            Integer stockAntes = inventario.getStockActual();
            Integer stockDespues = stockAntes - cantidadVendida;

            if (stockDespues < 0) {
                throw new RuntimeException(
                        "Stock insuficiente para el producto: "
                                + producto.getNombre()
                );
            }

            BigDecimal precioUnitario = producto.getPrecioVenta();
            BigDecimal costoUnitario = producto.getCostoUnitario();

            if (precioUnitario == null ||
                    precioUnitario.compareTo(BigDecimal.ZERO) <= 0) {

                throw new RuntimeException(
                        "El producto no tiene precio de venta definido: "
                                + producto.getNombre()
                );
            }

            if (costoUnitario == null) {
                costoUnitario = BigDecimal.ZERO;
            }

            BigDecimal subtotalDetalle = precioUnitario.multiply(
                    BigDecimal.valueOf(cantidadVendida)
            );

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVenta(ventaGuardada);
            detalle.setProducto(producto);
            detalle.setCantidad(cantidadVendida);
            detalle.setCostoUnitarioMomento(costoUnitario);
            detalle.setPrecioUnitarioMomento(precioUnitario);
            detalle.setSubtotal(subtotalDetalle);

            detalles.add(detalle);

            inventario.setStockActual(stockDespues);
            inventarioSucursalRepositorio.save(inventario);

            registrarMovimientoVenta(
                    cantidadVendida,
                    stockAntes,
                    stockDespues,
                    producto,
                    sucursal,
                    usuario,
                    ventaGuardada
            );

            subtotalVenta = subtotalVenta.add(subtotalDetalle);
        }

        if (descuento.compareTo(subtotalVenta) > 0) {
            throw new RuntimeException(
                    "El descuento no puede ser mayor al subtotal de la venta"
            );
        }

        BigDecimal totalFinal = subtotalVenta.subtract(descuento);

        ventaGuardada.getDetalles().addAll(detalles);

        ventaGuardada.setSubtotal(subtotalVenta);
        ventaGuardada.setDescuento(descuento);
        ventaGuardada.setTotal(totalFinal);

        Venta ventaFinal = facturaVentaRepositorio.save(ventaGuardada);

        return mapToFacturaVentaDTO(ventaFinal);
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaVentaDTO obtenerPorId(Long usuarioId, Long ventaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Venta venta = facturaVentaRepositorio.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        return mapToFacturaVentaDTO(venta);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacturaVentaDTO> listarPorSucursal(Long usuarioId, Long sucursalId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaVenta(usuario, sucursal);

        return facturaVentaRepositorio.findBySucursalOrderByFechaVentaDesc(sucursal)
                .stream()
                .map(this::mapToFacturaVentaDTO)
                .toList();
    }

    @Override
    public FacturaVentaDTO generarDevolucion(
            Long usuarioId,
            Long ventaId,
            DevolucionVentaDTO dto
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Venta venta = facturaVentaRepositorio.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        if (venta.getEstado() == EstadoFactura.CANCELADA) {
            throw new RuntimeException("No se puede generar devolución sobre una venta cancelada");
        }

        if (venta.getEstado() == EstadoFactura.DEVUELTA_TOTAL) {
            throw new RuntimeException("La venta ya fue devuelta totalmente");
        }

        for (DevolucionVentaItemDTO item : dto.getItems()) {

            DetalleVenta detalle = venta.getDetalles()
                    .stream()
                    .filter(d -> d.getProducto().getId().equals(item.getProductoId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException(
                            "El producto no pertenece a esta venta"
                    ));

            Integer cantidadDevueltaActual = detalle.getCantidadDevuelta() == null
                    ? 0
                    : detalle.getCantidadDevuelta();

            Integer cantidadDisponible = detalle.getCantidad() - cantidadDevueltaActual;

            if (item.getCantidad() > cantidadDisponible) {
                throw new RuntimeException(
                        "No puede devolver más unidades de las vendidas. Producto: "
                                + detalle.getProducto().getNombre()
                                + ". Disponible para devolución: "
                                + cantidadDisponible
                );
            }

            InventarioSucursal inventario = inventarioSucursalRepositorio
                    .findBySucursalIdAndProductoId(
                            venta.getSucursal().getId(),
                            detalle.getProducto().getId()
                    )
                    .orElseGet(() -> crearInventarioInicial(
                            venta.getSucursal(),
                            detalle.getProducto()
                    ));

            Integer stockAntes = inventario.getStockActual();
            Integer stockDespues = stockAntes + item.getCantidad();

            inventario.setStockActual(stockDespues);

            inventarioSucursalRepositorio.save(inventario);

            detalle.setCantidadDevuelta(cantidadDevueltaActual + item.getCantidad());

            registrarMovimientoDevolucion(
                    detalle,
                    item.getCantidad(),
                    stockAntes,
                    stockDespues,
                    venta,
                    usuario,
                    dto.getMotivo()
            );
        }

        actualizarEstadoDevolucion(venta);

        Venta ventaActualizada = facturaVentaRepositorio.save(venta);

        return mapToFacturaVentaDTO(ventaActualizada);
    }

    @Override
    public List<VentaHistorialDTO> historialVentas(Long usuarioId, Long sucursalId) {
        return List.of();
    }

    @Override
    @Transactional(readOnly = true)
    public InformeConsolidadoVentasDTO generarInformeConsolidado(
            Long usuarioId,
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaVenta(usuario, sucursal);

        validarRangoInforme(fechaInicio, fechaFin);

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.plusDays(1).atStartOfDay().minusNanos(1);

        List<Venta> ventas = facturaVentaRepositorio
                .findBySucursalAndFechaVentaBetweenOrderByFechaVentaDesc(
                        sucursal,
                        inicio,
                        fin
                );

        List<MovimientoInventario> ajustesNegativos = movimientoInventarioRepositorio
                .findBySucursalAndTipoAndFechaBetweenOrderByFechaDesc(
                        sucursal,
                        TipoMovimiento.AJUSTE_NEGATIVO,
                        inicio,
                        fin
                );

        List<InventarioSucursal> inventarioActual = inventarioSucursalRepositorio
                .findBySucursalId(sucursalId);

        InformeConsolidadoVentasDTO informe = new InformeConsolidadoVentasDTO();

        informe.setFechaInicio(fechaInicio);
        informe.setFechaFin(fechaFin);
        informe.setSucursalId(sucursal.getId());
        informe.setSucursalNombre(sucursal.getNombre());

        int facturasEmitidas = ventas.size();
        int facturasActivas = 0;
        int facturasCanceladas = 0;
        int facturasDevueltasParcial = 0;
        int facturasDevueltasTotal = 0;

        int productosVendidosNetos = 0;
        int productosDevueltos = 0;

        BigDecimal ventasBrutas = BigDecimal.ZERO;
        BigDecimal descuentos = BigDecimal.ZERO;
        BigDecimal ventasNetas = BigDecimal.ZERO;
        BigDecimal costoVendido = BigDecimal.ZERO;
        BigDecimal valorCancelado = BigDecimal.ZERO;
        BigDecimal valorDevuelto = BigDecimal.ZERO;

        Map<LocalDate, ResumenVentasDiaDTO> resumenPorDia = inicializarResumenPorDia(
                fechaInicio,
                fechaFin
        );

        for (Venta venta : ventas) {

            if (venta.getEstado() == EstadoFactura.ACTIVA) {
                facturasActivas++;
            }

            if (venta.getEstado() == EstadoFactura.CANCELADA) {
                facturasCanceladas++;

                valorCancelado = valorCancelado.add(
                        obtenerBigDecimalSeguro(venta.getTotal())
                );

                continue;
            }

            if (venta.getEstado() == EstadoFactura.DEVUELTA_PARCIAL) {
                facturasDevueltasParcial++;
            }

            if (venta.getEstado() == EstadoFactura.DEVUELTA_TOTAL) {
                facturasDevueltasTotal++;
            }

            BigDecimal subtotalVenta = obtenerBigDecimalSeguro(venta.getSubtotal());
            BigDecimal descuentoVenta = obtenerBigDecimalSeguro(venta.getDescuento());

            BigDecimal ventaBrutaEfectiva = BigDecimal.ZERO;
            BigDecimal costoEfectivo = BigDecimal.ZERO;
            BigDecimal valorDevueltoVenta = BigDecimal.ZERO;

            int productosVendidosVenta = 0;

            for (DetalleVenta detalle : venta.getDetalles()) {

                Integer cantidadVendida = detalle.getCantidad() == null
                        ? 0
                        : detalle.getCantidad();

                Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                        ? 0
                        : detalle.getCantidadDevuelta();

                Integer cantidadEfectiva = cantidadVendida - cantidadDevuelta;

                if (cantidadEfectiva < 0) {
                    cantidadEfectiva = 0;
                }

                BigDecimal precioUnitario = obtenerBigDecimalSeguro(
                        detalle.getPrecioUnitarioMomento()
                );

                BigDecimal costoUnitario = obtenerBigDecimalSeguro(
                        detalle.getCostoUnitarioMomento()
                );

                BigDecimal brutoDetalleEfectivo = precioUnitario.multiply(
                        BigDecimal.valueOf(cantidadEfectiva)
                );

                BigDecimal costoDetalleEfectivo = costoUnitario.multiply(
                        BigDecimal.valueOf(cantidadEfectiva)
                );

                BigDecimal brutoDetalleDevuelto = precioUnitario.multiply(
                        BigDecimal.valueOf(cantidadDevuelta)
                );

                ventaBrutaEfectiva = ventaBrutaEfectiva.add(brutoDetalleEfectivo);
                costoEfectivo = costoEfectivo.add(costoDetalleEfectivo);

                BigDecimal descuentoDevuelto = calcularDescuentoProporcional(
                        subtotalVenta,
                        descuentoVenta,
                        brutoDetalleDevuelto
                );

                BigDecimal netoDevueltoDetalle = brutoDetalleDevuelto.subtract(
                        descuentoDevuelto
                );

                valorDevueltoVenta = valorDevueltoVenta.add(netoDevueltoDetalle);

                productosVendidosVenta += cantidadEfectiva;
                productosDevueltos += cantidadDevuelta;
            }

            BigDecimal descuentoEfectivo = calcularDescuentoProporcional(
                    subtotalVenta,
                    descuentoVenta,
                    ventaBrutaEfectiva
            );

            BigDecimal ventaNetaEfectiva = ventaBrutaEfectiva.subtract(
                    descuentoEfectivo
            );

            ventasBrutas = ventasBrutas.add(ventaBrutaEfectiva);
            descuentos = descuentos.add(descuentoEfectivo);
            ventasNetas = ventasNetas.add(ventaNetaEfectiva);
            costoVendido = costoVendido.add(costoEfectivo);
            valorDevuelto = valorDevuelto.add(valorDevueltoVenta);

            productosVendidosNetos += productosVendidosVenta;

            LocalDate fechaVenta = venta.getFechaVenta().toLocalDate();

            ResumenVentasDiaDTO resumenDia = resumenPorDia.get(fechaVenta);

            if (resumenDia != null) {
                resumenDia.setFacturas(resumenDia.getFacturas() + 1);
                resumenDia.setProductosVendidos(
                        resumenDia.getProductosVendidos() + productosVendidosVenta
                );

                resumenDia.setVentasBrutas(
                        resumenDia.getVentasBrutas().add(ventaBrutaEfectiva)
                );

                resumenDia.setDescuentos(
                        resumenDia.getDescuentos().add(descuentoEfectivo)
                );

                resumenDia.setVentasNetas(
                        resumenDia.getVentasNetas().add(ventaNetaEfectiva)
                );

                resumenDia.setCostoVendido(
                        resumenDia.getCostoVendido().add(costoEfectivo)
                );

                resumenDia.setUtilidad(
                        resumenDia.getVentasNetas().subtract(resumenDia.getCostoVendido())
                );
            }
        }

        BigDecimal utilidadBruta = ventasNetas.subtract(costoVendido);

        BigDecimal costoAjustesNegativos = BigDecimal.ZERO;
        Integer unidadesAjustadasNegativas = 0;

        for (MovimientoInventario movimiento : ajustesNegativos) {

            Integer cantidad = movimiento.getCantidad() == null
                    ? 0
                    : Math.abs(movimiento.getCantidad());

            BigDecimal costoMomento = obtenerBigDecimalSeguro(
                    movimiento.getCostoUnitarioMomento()
            );

            BigDecimal costoMovimiento = costoMomento.multiply(
                    BigDecimal.valueOf(cantidad)
            );

            costoAjustesNegativos = costoAjustesNegativos.add(costoMovimiento);
            unidadesAjustadasNegativas += cantidad;
        }

        BigDecimal resultadoOperativoEstimado = utilidadBruta.subtract(
                costoAjustesNegativos
        );

        Integer unidadesInventarioActual = 0;
        BigDecimal costoInventarioActual = BigDecimal.ZERO;
        BigDecimal valorComercialInventarioActual = BigDecimal.ZERO;

        for (InventarioSucursal inventario : inventarioActual) {

            Integer stock = inventario.getStockActual() == null
                    ? 0
                    : inventario.getStockActual();

            BigDecimal costoUnitario = inventario.getProducto().getCostoUnitario() == null
                    ? BigDecimal.ZERO
                    : inventario.getProducto().getCostoUnitario();

            BigDecimal precioVenta = inventario.getProducto().getPrecioVenta() == null
                    ? BigDecimal.ZERO
                    : inventario.getProducto().getPrecioVenta();

            unidadesInventarioActual += stock;

            costoInventarioActual = costoInventarioActual.add(
                    costoUnitario.multiply(BigDecimal.valueOf(stock))
            );

            valorComercialInventarioActual = valorComercialInventarioActual.add(
                    precioVenta.multiply(BigDecimal.valueOf(stock))
            );
        }

        BigDecimal utilidadProyectadaInventario =
                valorComercialInventarioActual.subtract(costoInventarioActual);

        informe.setFacturasEmitidas(facturasEmitidas);
        informe.setFacturasActivas(facturasActivas);
        informe.setFacturasCanceladas(facturasCanceladas);
        informe.setFacturasDevueltasParcial(facturasDevueltasParcial);
        informe.setFacturasDevueltasTotal(facturasDevueltasTotal);

        informe.setProductosVendidos(productosVendidosNetos);
        informe.setProductosDevueltos(productosDevueltos);

        informe.setVentasBrutas(ventasBrutas);
        informe.setDescuentos(descuentos);
        informe.setVentasNetas(ventasNetas);

        informe.setCostoVendido(costoVendido);
        informe.setUtilidadBruta(utilidadBruta);

        informe.setValorCancelado(valorCancelado);
        informe.setValorDevuelto(valorDevuelto);

        informe.setCostoAjustesNegativos(costoAjustesNegativos);
        informe.setUnidadesAjustadasNegativas(unidadesAjustadasNegativas);

        informe.setResultadoOperativoEstimado(resultadoOperativoEstimado);

        informe.setUnidadesInventarioActual(unidadesInventarioActual);
        informe.setCostoInventarioActual(costoInventarioActual);
        informe.setValorComercialInventarioActual(valorComercialInventarioActual);
        informe.setUtilidadProyectadaInventario(utilidadProyectadaInventario);

        informe.setVentasPorDia(
                resumenPorDia.values()
                        .stream()
                        .toList()
        );

        return informe;
    }

    private void validarRangoInforme(
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        if (fechaInicio == null || fechaFin == null) {
            throw new RuntimeException("Debe seleccionar fecha inicial y fecha final");
        }

        if (fechaFin.isBefore(fechaInicio)) {
            throw new RuntimeException("La fecha final no puede ser menor que la fecha inicial");
        }

        LocalDate fechaMaxima = fechaInicio.plusMonths(12);

        if (fechaFin.isAfter(fechaMaxima)) {
            throw new RuntimeException("El rango del informe no puede superar 12 meses");
        }
    }


    private BigDecimal calcularDescuentoProporcional(
            BigDecimal subtotalVenta,
            BigDecimal descuentoVenta,
            BigDecimal valorBase
    ) {

        if (subtotalVenta == null ||
                subtotalVenta.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (descuentoVenta == null ||
                descuentoVenta.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (valorBase == null ||
                valorBase.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        return valorBase
                .multiply(descuentoVenta)
                .divide(subtotalVenta, 2, RoundingMode.HALF_UP);
    }


    private Map<LocalDate, ResumenVentasDiaDTO> inicializarResumenPorDia(
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        Map<LocalDate, ResumenVentasDiaDTO> resumenPorDia = new LinkedHashMap<>();

        LocalDate fechaActual = fechaInicio;

        while (!fechaActual.isAfter(fechaFin)) {

            ResumenVentasDiaDTO resumen = new ResumenVentasDiaDTO();

            resumen.setFecha(fechaActual);
            resumen.setFacturas(0);
            resumen.setProductosVendidos(0);
            resumen.setVentasBrutas(BigDecimal.ZERO);
            resumen.setDescuentos(BigDecimal.ZERO);
            resumen.setVentasNetas(BigDecimal.ZERO);
            resumen.setCostoVendido(BigDecimal.ZERO);
            resumen.setUtilidad(BigDecimal.ZERO);

            resumenPorDia.put(fechaActual, resumen);

            fechaActual = fechaActual.plusDays(1);
        }

        return resumenPorDia;
    }

    private BigDecimal obtenerBigDecimalSeguro(BigDecimal valor) {

        return valor == null
                ? BigDecimal.ZERO
                : valor;
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaVentaDTO obtenerPorNumero(Long usuarioId, String numeroVenta) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Venta venta = facturaVentaRepositorio.findByNumeroVenta(numeroVenta)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        return mapToFacturaVentaDTO(venta);
    }

    @Override
    public FacturaVentaDTO cancelarVenta(Long usuarioId, Long ventaId, String motivo) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoCancelarVenta(usuario);

        Venta venta = facturaVentaRepositorio.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        if (venta.getEstado() == EstadoFactura.CANCELADA) {
            throw new RuntimeException("La venta ya se encuentra cancelada");
        }

        if (venta.getEstado() == EstadoFactura.DEVUELTA_TOTAL) {
            throw new RuntimeException("No se puede cancelar una venta que ya fue devuelta totalmente");
        }

        for (DetalleVenta detalle : venta.getDetalles()) {

            Producto producto = detalle.getProducto();

            Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                    ? 0
                    : detalle.getCantidadDevuelta();

            Integer cantidadAReintegrar = detalle.getCantidad() - cantidadDevuelta;

            if (cantidadAReintegrar <= 0) {
                continue;
            }

            InventarioSucursal inventario = inventarioSucursalRepositorio
                    .findBySucursalIdAndProductoId(
                            venta.getSucursal().getId(),
                            producto.getId()
                    )
                    .orElseGet(() -> crearInventarioInicial(
                            venta.getSucursal(),
                            producto
                    ));

            Integer stockAntes = inventario.getStockActual();
            Integer stockDespues = stockAntes + cantidadAReintegrar;

            inventario.setStockActual(stockDespues);

            inventarioSucursalRepositorio.save(inventario);

            registrarMovimientoCancelacion(
                    detalle,
                    cantidadAReintegrar,
                    stockAntes,
                    stockDespues,
                    venta,
                    usuario,
                    motivo
            );
        }

        venta.setEstado(EstadoFactura.CANCELADA);

        if (motivo != null && !motivo.isBlank()) {
            venta.setObservacion(
                    venta.getObservacion() == null || venta.getObservacion().isBlank()
                            ? "Cancelación: " + motivo
                            : venta.getObservacion() + " | Cancelación: " + motivo
            );
        }

        Venta ventaActualizada = facturaVentaRepositorio.save(venta);

        return mapToFacturaVentaDTO(ventaActualizada);
    }

    @Override
    @Transactional(readOnly = true)
    public InformeVentasDTO generarInformeVentas(
            Long usuarioId,
            Long sucursalId,
            String periodo,
            LocalDate fecha
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaVenta(usuario, sucursal);

        LocalDate fechaBase = fecha != null ? fecha : LocalDate.now();

        String periodoNormalizado = periodo == null
                ? "DIA"
                : periodo.trim().toUpperCase();

        LocalDate fechaInicio;
        LocalDate fechaFin;

        switch (periodoNormalizado) {

            case "DIA":
                fechaInicio = fechaBase;
                fechaFin = fechaBase;
                break;

            case "SEMANA":
                fechaInicio = fechaBase.with(DayOfWeek.MONDAY);
                fechaFin = fechaInicio.plusDays(6);
                break;

            case "MES":
                YearMonth yearMonth = YearMonth.from(fechaBase);
                fechaInicio = yearMonth.atDay(1);
                fechaFin = yearMonth.atEndOfMonth();
                break;

            default:
                throw new RuntimeException("Periodo no válido. Use DIA, SEMANA o MES");
        }

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.plusDays(1).atStartOfDay().minusNanos(1);

        List<Venta> ventas = facturaVentaRepositorio
                .findBySucursalAndEstadoAndFechaVentaBetweenOrderByFechaVentaDesc(
                        sucursal,
                        EstadoFactura.ACTIVA,
                        inicio,
                        fin
                );

        InformeVentasDTO informe = new InformeVentasDTO();

        informe.setPeriodo(periodoNormalizado);
        informe.setFechaInicio(fechaInicio);
        informe.setFechaFin(fechaFin);
        informe.setSucursalId(sucursal.getId());
        informe.setSucursalNombre(sucursal.getNombre());

        Integer cantidadVentas = ventas.size();

        Integer cantidadProductosVendidos = ventas.stream()
                .flatMap(venta -> venta.getDetalles().stream())
                .mapToInt(DetalleVenta::getCantidad)
                .sum();

        BigDecimal subtotal = ventas.stream()
                .map(Venta::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal total = ventas.stream()
                .map(Venta::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal costoTotal = ventas.stream()
                .flatMap(venta -> venta.getDetalles().stream())
                .map(detalle -> detalle.getCostoUnitarioMomento()
                        .multiply(BigDecimal.valueOf(detalle.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal utilidad = total.subtract(costoTotal);

        informe.setCantidadVentas(cantidadVentas);
        informe.setCantidadProductosVendidos(cantidadProductosVendidos);
        informe.setSubtotal(subtotal);
        informe.setTotal(total);
        informe.setCostoTotal(costoTotal);
        informe.setUtilidad(utilidad);

        informe.setVentasPorDia(
                construirReportePorDia(ventas, fechaInicio, fechaFin)
        );

        return informe;
    }

    private Map<Long, Integer> agruparProductos(List<VentaItemDTO> items) {

        if (items == null || items.isEmpty()) {
            throw new RuntimeException("La venta debe tener al menos un producto");
        }

        Map<Long, Integer> agrupados = new LinkedHashMap<>();

        for (VentaItemDTO item : items) {

            if (item.getProductoId() == null) {
                throw new RuntimeException("El producto es obligatorio");
            }

            if (item.getCantidad() == null || item.getCantidad() <= 0) {
                throw new RuntimeException("La cantidad debe ser mayor a cero");
            }

            agrupados.merge(
                    item.getProductoId(),
                    item.getCantidad(),
                    Integer::sum
            );
        }

        return agrupados;
    }

    private void validarProductosYStock(
            Map<Long, Integer> productosAgrupados,
            Sucursal sucursal
    ) {

        for (Map.Entry<Long, Integer> entry : productosAgrupados.entrySet()) {

            Long productoId = entry.getKey();
            Integer cantidadSolicitada = entry.getValue();

            Producto producto = obtenerProducto(productoId);

            validarProductoPerteneceAEmpresa(
                    producto,
                    sucursal.getEmpresa().getId()
            );

            InventarioSucursal inventario = obtenerInventario(
                    sucursal.getId(),
                    producto.getId()
            );

            if (inventario.getStockActual() < cantidadSolicitada) {
                throw new RuntimeException(
                        "Stock insuficiente para el producto: " + producto.getNombre()
                );
            }
        }
    }

    private void registrarMovimientoVenta(
            Integer cantidadVendida,
            Integer stockAntes,
            Integer stockDespues,
            Producto producto,
            Sucursal sucursal,
            Usuario usuario,
            Venta venta
    ) {

        MovimientoInventario movimiento = new MovimientoInventario();

        movimiento.setTipo(TipoMovimiento.VENTA);
        movimiento.setCantidad(cantidadVendida * -1);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);
        movimiento.setMotivo("Venta " + venta.getNumeroVenta());
        movimiento.setReferenciaId(venta.getId());

        movimiento.setProducto(producto);
        movimiento.setSucursal(sucursal);
        movimiento.setUsuario(usuario);

        movimiento.setCostoUnitarioMomento(producto.getCostoUnitario());
        movimiento.setPrecioVentaMomento(producto.getPrecioVenta());

        movimientoInventarioRepositorio.save(movimiento);
    }


    private void validarRangoMaximoDoceMeses(
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
        if (fechaInicio == null || fechaFin == null) {
            throw new RuntimeException("Debe seleccionar fecha inicial y fecha final");
        }

        if (fechaFin.isBefore(fechaInicio)) {
            throw new RuntimeException("La fecha final no puede ser menor que la fecha inicial");
        }

        LocalDate fechaMaxima = fechaInicio.plusMonths(12);

        if (fechaFin.isAfter(fechaMaxima)) {
            throw new RuntimeException("El rango del informe no puede superar 12 meses");
        }
    }


    private void registrarMovimientoDevolucion(
            DetalleVenta detalle,
            Integer cantidadDevuelta,
            Integer stockAntes,
            Integer stockDespues,
            Venta venta,
            Usuario usuario,
            String motivo
    ) {

        MovimientoInventario movimiento = new MovimientoInventario();

        movimiento.setTipo(TipoMovimiento.DEVOLUCION);
        movimiento.setCantidad(cantidadDevuelta);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);

        String concepto = "Devolución venta " + venta.getNumeroVenta();

        if (motivo != null && !motivo.isBlank()) {
            concepto = concepto + " - " + motivo;
        }

        movimiento.setMotivo(concepto);
        movimiento.setReferenciaId(venta.getId());

        movimiento.setProducto(detalle.getProducto());
        movimiento.setSucursal(venta.getSucursal());
        movimiento.setUsuario(usuario);

        movimiento.setCostoUnitarioMomento(detalle.getCostoUnitarioMomento());
        movimiento.setPrecioVentaMomento(detalle.getPrecioUnitarioMomento());

        movimientoInventarioRepositorio.save(movimiento);
    }

    private void registrarMovimientoCancelacion(
            DetalleVenta detalle,
            Integer cantidadReintegrada,
            Integer stockAntes,
            Integer stockDespues,
            Venta venta,
            Usuario usuario,
            String motivo
    ) {

        MovimientoInventario movimiento = new MovimientoInventario();

        movimiento.setTipo(TipoMovimiento.CANCELACION_FACTURA);
        movimiento.setCantidad(cantidadReintegrada);
        movimiento.setStockAntes(stockAntes);
        movimiento.setStockDespues(stockDespues);

        String concepto = "Cancelación venta " + venta.getNumeroVenta();

        if (motivo != null && !motivo.isBlank()) {
            concepto = concepto + " - " + motivo;
        }

        movimiento.setMotivo(concepto);
        movimiento.setReferenciaId(venta.getId());

        movimiento.setProducto(detalle.getProducto());
        movimiento.setSucursal(venta.getSucursal());
        movimiento.setUsuario(usuario);

        movimiento.setCostoUnitarioMomento(detalle.getCostoUnitarioMomento());
        movimiento.setPrecioVentaMomento(detalle.getPrecioUnitarioMomento());

        movimientoInventarioRepositorio.save(movimiento);
    }

    private void actualizarEstadoDevolucion(Venta venta) {

        boolean todosDevueltos = venta.getDetalles()
                .stream()
                .allMatch(detalle -> {
                    Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                            ? 0
                            : detalle.getCantidadDevuelta();

                    return cantidadDevuelta.equals(detalle.getCantidad());
                });

        boolean algunoDevuelto = venta.getDetalles()
                .stream()
                .anyMatch(detalle -> {
                    Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                            ? 0
                            : detalle.getCantidadDevuelta();

                    return cantidadDevuelta > 0;
                });

        if (todosDevueltos) {
            venta.setEstado(EstadoFactura.DEVUELTA_TOTAL);
            return;
        }

        if (algunoDevuelto) {
            venta.setEstado(EstadoFactura.DEVUELTA_PARCIAL);
        }
    }

    private InventarioSucursal crearInventarioInicial(
            Sucursal sucursal,
            Producto producto
    ) {

        InventarioSucursal inventario = new InventarioSucursal();

        inventario.setSucursal(sucursal);
        inventario.setProducto(producto);
        inventario.setStockActual(0);

        return inventario;
    }

    private String generarNumeroVenta(Sucursal sucursal) {
        return "VEN-" + sucursal.getId() + "-" + System.currentTimeMillis();
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

    private Cliente obtenerCliente(Long clienteId) {

        if (clienteId == null) {
            throw new RuntimeException("El cliente es obligatorio");
        }

        return clienteRepositorio.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }

    private InventarioSucursal obtenerInventario(
            Long sucursalId,
            Long productoId
    ) {
        return inventarioSucursalRepositorio
                .findBySucursalIdAndProductoId(sucursalId, productoId)
                .orElseThrow(() -> new RuntimeException(
                        "El producto no tiene inventario en esta sucursal"
                ));
    }

    private void validarAccesoVenta(Usuario usuario, Sucursal sucursal) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }

        if (!usuario.getEmpresa().getId().equals(sucursal.getEmpresa().getId())) {
            throw new RuntimeException("No puede vender en una sucursal de otra empresa");
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {

            if (usuario.getSucursal() == null) {
                throw new RuntimeException("El empleado no tiene sucursal asignada");
            }

            if (!usuario.getSucursal().getId().equals(sucursal.getId())) {
                throw new RuntimeException("El empleado solo puede vender en su sucursal");
            }
        }
    }

    private void validarAccesoConsultaVenta(Usuario usuario, Sucursal sucursal) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }

        if (!usuario.getEmpresa().getId().equals(sucursal.getEmpresa().getId())) {
            throw new RuntimeException("No puede consultar ventas de otra empresa");
        }

        if (usuario.getRol() == RolEnum.EMPLEADO) {

            if (usuario.getSucursal() == null) {
                throw new RuntimeException("El empleado no tiene sucursal asignada");
            }

            if (!usuario.getSucursal().getId().equals(sucursal.getId())) {
                throw new RuntimeException("El empleado solo puede consultar ventas de su sucursal");
            }
        }
    }

    private void validarProductoPerteneceAEmpresa(
            Producto producto,
            Long empresaId
    ) {

        if (!producto.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException(
                    "El producto no pertenece a la empresa de la sucursal"
            );
        }
    }

    private void validarClientePerteneceAEmpresa(
            Cliente cliente,
            Long empresaId
    ) {

        if (!cliente.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException(
                    "El cliente no pertenece a la empresa de la sucursal"
            );
        }
    }

    private void validarPermisoCancelarVenta(Usuario usuario) {

        if (usuario.getRol() != RolEnum.SUPER_ADMIN &&
                usuario.getRol() != RolEnum.ADMIN) {

            throw new RuntimeException("No tiene permisos para cancelar ventas");
        }
    }

    private List<ReporteVentasDiaDTO> construirReportePorDia(
            List<Venta> ventas,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        Map<LocalDate, ReporteVentasDiaDTO> reportePorDia = new HashMap<>();

        LocalDate fechaActual = fechaInicio;

        while (!fechaActual.isAfter(fechaFin)) {

            ReporteVentasDiaDTO reporte = new ReporteVentasDiaDTO();

            reporte.setFecha(fechaActual);
            reporte.setCantidadVentas(0);
            reporte.setCantidadProductosVendidos(0);
            reporte.setSubtotal(BigDecimal.ZERO);
            reporte.setTotal(BigDecimal.ZERO);
            reporte.setCostoTotal(BigDecimal.ZERO);
            reporte.setUtilidad(BigDecimal.ZERO);

            reportePorDia.put(fechaActual, reporte);

            fechaActual = fechaActual.plusDays(1);
        }

        for (Venta venta : ventas) {

            LocalDate fechaVenta = venta.getFechaVenta().toLocalDate();

            ReporteVentasDiaDTO reporte = reportePorDia.get(fechaVenta);

            if (reporte == null) {
                continue;
            }

            Integer productosVendidos = venta.getDetalles()
                    .stream()
                    .mapToInt(DetalleVenta::getCantidad)
                    .sum();

            BigDecimal costoVenta = venta.getDetalles()
                    .stream()
                    .map(detalle -> detalle.getCostoUnitarioMomento()
                            .multiply(BigDecimal.valueOf(detalle.getCantidad())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            reporte.setCantidadVentas(reporte.getCantidadVentas() + 1);

            reporte.setCantidadProductosVendidos(
                    reporte.getCantidadProductosVendidos() + productosVendidos
            );

            reporte.setSubtotal(
                    reporte.getSubtotal().add(venta.getSubtotal())
            );

            reporte.setTotal(
                    reporte.getTotal().add(venta.getTotal())
            );

            reporte.setCostoTotal(
                    reporte.getCostoTotal().add(costoVenta)
            );

            reporte.setUtilidad(
                    reporte.getTotal().subtract(reporte.getCostoTotal())
            );
        }

        return reportePorDia.values()
                .stream()
                .toList();
    }

    private FacturaVentaDTO mapToFacturaVentaDTO(Venta venta) {

        FacturaVentaDTO dto = new FacturaVentaDTO();

        dto.setId(venta.getId());
        dto.setNumeroVenta(venta.getNumeroVenta());

        dto.setSucursalId(venta.getSucursal().getId());
        dto.setSucursalNombre(venta.getSucursal().getNombre());

        dto.setUsuarioId(venta.getUsuario().getId());
        dto.setUsuarioNombre(venta.getUsuario().getNombre());

        if (venta.getCliente() != null) {
            dto.setClienteId(venta.getCliente().getId());
            dto.setClienteNombre(venta.getCliente().getNombre());
            dto.setClienteDocumento(venta.getCliente().getNumeroDocumento());
        } else {
            dto.setClienteId(null);
            dto.setClienteNombre("Cliente no asignado");
            dto.setClienteDocumento("Sin documento");
        }

        dto.setEstado(venta.getEstado());

        dto.setSubtotal(venta.getSubtotal());

        dto.setDescuento(
                venta.getDescuento() == null
                        ? BigDecimal.ZERO
                        : venta.getDescuento()
        );

        dto.setTotal(venta.getTotal());

        dto.setObservacion(venta.getObservacion());

        dto.setFechaVenta(venta.getFechaVenta());

        List<DetalleFacturaVentaDTO> detalles = venta.getDetalles()
                .stream()
                .map(this::mapToDetalleFacturaVentaDTO)
                .toList();

        dto.setDetalles(detalles);

        return dto;
    }


    @Override
    @Transactional(readOnly = true)
    public RankingProductosVentasDTO obtenerRankingProductosVentas(
            Long usuarioId,
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaVenta(usuario, sucursal);

        if (fechaInicio == null || fechaFin == null) {
            throw new RuntimeException("Debe seleccionar fecha inicial y fecha final");
        }

        if (fechaFin.isBefore(fechaInicio)) {
            throw new RuntimeException("La fecha final no puede ser menor que la fecha inicial");
        }

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.plusDays(1).atStartOfDay().minusNanos(1);

        List<Venta> ventas = facturaVentaRepositorio
                .findBySucursalAndFechaVentaBetweenOrderByFechaVentaDesc(
                        sucursal,
                        inicio,
                        fin
                );

        List<InventarioSucursal> inventarioSucursal =
                inventarioSucursalRepositorio.findBySucursalId(sucursalId);

        Map<Long, ProductoRankingVentasDTO> rankingPorProducto = new LinkedHashMap<>();

        for (InventarioSucursal inventario : inventarioSucursal) {

            if (inventario.getProducto() == null) {
                continue;
            }

            Producto producto = inventario.getProducto();

            ProductoRankingVentasDTO dto = new ProductoRankingVentasDTO();

            dto.setProductoId(producto.getId());
            dto.setCodigo(producto.getCodigo());
            dto.setNombre(producto.getNombre());
            dto.setStockActual(
                    inventario.getStockActual() == null
                            ? 0
                            : inventario.getStockActual()
            );
            dto.setCantidadVendida(0);
            dto.setCantidadDevuelta(0);
            dto.setValorVendido(BigDecimal.ZERO);
            dto.setUtilidadEstimada(BigDecimal.ZERO);

            rankingPorProducto.put(producto.getId(), dto);
        }

        for (Venta venta : ventas) {

            if (venta.getEstado() == EstadoFactura.CANCELADA) {
                continue;
            }

            for (DetalleVenta detalle : venta.getDetalles()) {

                Producto producto = detalle.getProducto();

                if (producto == null) {
                    continue;
                }

                ProductoRankingVentasDTO dto = rankingPorProducto.get(producto.getId());

                if (dto == null) {
                    dto = new ProductoRankingVentasDTO();

                    dto.setProductoId(producto.getId());
                    dto.setCodigo(producto.getCodigo());
                    dto.setNombre(producto.getNombre());
                    dto.setStockActual(0);
                    dto.setCantidadVendida(0);
                    dto.setCantidadDevuelta(0);
                    dto.setValorVendido(BigDecimal.ZERO);
                    dto.setUtilidadEstimada(BigDecimal.ZERO);

                    rankingPorProducto.put(producto.getId(), dto);
                }

                int cantidadVendida = detalle.getCantidad() == null
                        ? 0
                        : detalle.getCantidad();

                int cantidadDevuelta = detalle.getCantidadDevuelta() == null
                        ? 0
                        : detalle.getCantidadDevuelta();

                int cantidadRealVendida = cantidadVendida - cantidadDevuelta;

                if (cantidadRealVendida < 0) {
                    cantidadRealVendida = 0;
                }

                BigDecimal precioUnitario = detalle.getPrecioUnitarioMomento() == null
                        ? BigDecimal.ZERO
                        : detalle.getPrecioUnitarioMomento();

                BigDecimal costoUnitario = detalle.getCostoUnitarioMomento() == null
                        ? BigDecimal.ZERO
                        : detalle.getCostoUnitarioMomento();

                BigDecimal valorVendido = precioUnitario.multiply(
                        BigDecimal.valueOf(cantidadRealVendida)
                );

                BigDecimal utilidad = precioUnitario
                        .subtract(costoUnitario)
                        .multiply(BigDecimal.valueOf(cantidadRealVendida));

                dto.setCantidadVendida(
                        dto.getCantidadVendida() + cantidadRealVendida
                );

                dto.setCantidadDevuelta(
                        dto.getCantidadDevuelta() + cantidadDevuelta
                );

                dto.setValorVendido(
                        dto.getValorVendido().add(valorVendido)
                );

                dto.setUtilidadEstimada(
                        dto.getUtilidadEstimada().add(utilidad)
                );
            }
        }

        List<ProductoRankingVentasDTO> productos = rankingPorProducto.values()
                .stream()
                .toList();

        List<ProductoRankingVentasDTO> productosMasVendidos = productos.stream()
                .sorted(
                        Comparator.comparing(
                                ProductoRankingVentasDTO::getCantidadVendida
                        ).reversed()
                )
                .limit(3)
                .toList();

        List<ProductoRankingVentasDTO> productosMenosVendidos = productos.stream()
                .sorted(
                        Comparator.comparing(
                                ProductoRankingVentasDTO::getCantidadVendida
                        )
                )
                .limit(3)
                .toList();

        RankingProductosVentasDTO respuesta = new RankingProductosVentasDTO();

        respuesta.setSucursalId(sucursal.getId());
        respuesta.setSucursalNombre(sucursal.getNombre());
        respuesta.setFechaInicio(fechaInicio);
        respuesta.setFechaFin(fechaFin);
        respuesta.setProductosMasVendidos(productosMasVendidos);
        respuesta.setProductosMenosVendidos(productosMenosVendidos);

        return respuesta;
    }


    private DetalleFacturaVentaDTO mapToDetalleFacturaVentaDTO(
            DetalleVenta detalle
    ) {

        DetalleFacturaVentaDTO dto = new DetalleFacturaVentaDTO();

        Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                ? 0
                : detalle.getCantidadDevuelta();

        dto.setProductoId(detalle.getProducto().getId());
        dto.setProductoCodigo(detalle.getProducto().getCodigo());
        dto.setProductoNombre(detalle.getProducto().getNombre());

        dto.setCantidad(detalle.getCantidad());
        dto.setCantidadDevuelta(cantidadDevuelta);
        dto.setCantidadDisponibleDevolucion(
                detalle.getCantidad() - cantidadDevuelta
        );

        dto.setCostoUnitarioMomento(detalle.getCostoUnitarioMomento());
        dto.setPrecioUnitarioMomento(detalle.getPrecioUnitarioMomento());
        dto.setSubtotal(detalle.getSubtotal());

        return dto;
    }


    //metodos para mapear las ventas para el empleado

    private FacturaVentaEmpleadoDTO mapToFacturaVentaEmpleadoDTO(Venta venta) {

        FacturaVentaEmpleadoDTO dto = new FacturaVentaEmpleadoDTO();

        dto.setId(venta.getId());
        dto.setNumeroVenta(venta.getNumeroVenta());

        dto.setSucursalId(venta.getSucursal().getId());
        dto.setSucursalNombre(venta.getSucursal().getNombre());

        dto.setUsuarioId(venta.getUsuario().getId());
        dto.setUsuarioNombre(venta.getUsuario().getNombre());

        if (venta.getCliente() != null) {
            dto.setClienteId(venta.getCliente().getId());
            dto.setClienteNombre(venta.getCliente().getNombre());
            dto.setClienteDocumento(venta.getCliente().getNumeroDocumento());
        } else {
            dto.setClienteId(null);
            dto.setClienteNombre("Cliente no asignado");
            dto.setClienteDocumento("Sin documento");
        }

        dto.setEstado(venta.getEstado());

        dto.setDescuento(
                venta.getDescuento() == null
                        ? BigDecimal.ZERO
                        : venta.getDescuento()
        );

        dto.setSubtotal(
                venta.getSubtotal() == null
                        ? BigDecimal.ZERO
                        : venta.getSubtotal()
        );

        dto.setTotal(
                venta.getTotal() == null
                        ? BigDecimal.ZERO
                        : venta.getTotal()
        );

        dto.setObservacion(venta.getObservacion());
        dto.setFechaVenta(venta.getFechaVenta());

        dto.setDetalles(
                venta.getDetalles()
                        .stream()
                        .map(this::mapToDetalleFacturaVentaEmpleadoDTO)
                        .toList()
        );

        return dto;
    }

    public FacturaVentaEmpleadoDTO obtenerPorIdEmpleado(Long usuarioId, Long ventaId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Venta venta = facturaVentaRepositorio.findById(ventaId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        return mapToFacturaVentaEmpleadoDTO(venta);
    }

    private DetalleFacturaVentaEmpleadoDTO mapToDetalleFacturaVentaEmpleadoDTO(
            DetalleVenta detalle
    ) {

        DetalleFacturaVentaEmpleadoDTO dto = new DetalleFacturaVentaEmpleadoDTO();

        Integer cantidadVendida = detalle.getCantidad() == null
                ? 0
                : detalle.getCantidad();

        Integer cantidadDevuelta = detalle.getCantidadDevuelta() == null
                ? 0
                : detalle.getCantidadDevuelta();

        dto.setProductoId(detalle.getProducto().getId());
        dto.setProductoCodigo(detalle.getProducto().getCodigo());
        dto.setProductoNombre(detalle.getProducto().getNombre());

        dto.setCantidad(cantidadVendida);
        dto.setCantidadDevuelta(cantidadDevuelta);

        dto.setCantidadDisponibleDevolucion(
                cantidadVendida - cantidadDevuelta
        );

        dto.setPrecioUnitarioMomento(detalle.getPrecioUnitarioMomento());
        dto.setSubtotal(detalle.getSubtotal());

        return dto;
    }

    private VentaHistorialEmpleadoDTO mapToVentaHistorialEmpleadoDTO(Venta venta) {

        VentaHistorialEmpleadoDTO dto = new VentaHistorialEmpleadoDTO();

        dto.setId(venta.getId());
        dto.setNumeroVenta(venta.getNumeroVenta());

        if (venta.getUsuario() != null) {
            dto.setUsuarioId(venta.getUsuario().getId());
            dto.setUsuarioNombre(venta.getUsuario().getNombre());
        } else {
            dto.setUsuarioId(null);
            dto.setUsuarioNombre("Usuario no asignado");
        }

        if (venta.getCliente() != null) {
            dto.setClienteNombre(venta.getCliente().getNombre());
            dto.setClienteDocumento(venta.getCliente().getNumeroDocumento());
        } else {
            dto.setClienteNombre("Cliente no asignado");
            dto.setClienteDocumento("Sin documento");
        }

        dto.setEstado(venta.getEstado());

        dto.setSubtotal(
                venta.getSubtotal() == null
                        ? BigDecimal.ZERO
                        : venta.getSubtotal()
        );

        dto.setDescuento(
                venta.getDescuento() == null
                        ? BigDecimal.ZERO
                        : venta.getDescuento()
        );

        dto.setTotal(
                venta.getTotal() == null
                        ? BigDecimal.ZERO
                        : venta.getTotal()
        );

        dto.setFechaVenta(venta.getFechaVenta());

        return dto;
    }


    public List<VentaHistorialEmpleadoDTO> listarPorSucursalEmpleado(
            Long usuarioId,
            Long sucursalId
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        Sucursal sucursal = obtenerSucursal(sucursalId);

        validarAccesoConsultaVenta(usuario, sucursal);

        return facturaVentaRepositorio.findBySucursalOrderByFechaVentaDesc(sucursal)
                .stream()
                .map(this::mapToVentaHistorialEmpleadoDTO)
                .toList();
    }




    @Override
    public FacturaVentaEmpleadoDTO crearVentaEmpleado(Long usuarioId, CrearVentaDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        FacturaVentaDTO ventaAdminDTO = crearVenta(usuarioId, dto);

        Venta venta = facturaVentaRepositorio.findById(ventaAdminDTO.getId())
                .orElseThrow(() -> new RuntimeException("Venta no encontrada después de crearla"));

        return mapToFacturaVentaEmpleadoDTO(venta);
    }

    @Override
    public FacturaVentaEmpleadoDTO generarDevolucionEmpleado(
            Long usuarioId,
            Long ventaId,
            DevolucionVentaDTO dto
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        FacturaVentaDTO ventaAdminDTO = generarDevolucion(usuarioId, ventaId, dto);

        Venta venta = facturaVentaRepositorio.findById(ventaAdminDTO.getId())
                .orElseThrow(() -> new RuntimeException("Venta no encontrada después de generar devolución"));

        return mapToFacturaVentaEmpleadoDTO(venta);
    }

    @Override
    @Transactional(readOnly = true)
    public FacturaVentaEmpleadoDTO obtenerPorNumeroEmpleado(
            Long usuarioId,
            String numeroVenta
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() != RolEnum.EMPLEADO) {
            throw new RuntimeException("Este endpoint es solo para empleados");
        }

        Venta venta = facturaVentaRepositorio.findByNumeroVenta(numeroVenta)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));

        validarAccesoConsultaVenta(usuario, venta.getSucursal());

        return mapToFacturaVentaEmpleadoDTO(venta);
    }



}