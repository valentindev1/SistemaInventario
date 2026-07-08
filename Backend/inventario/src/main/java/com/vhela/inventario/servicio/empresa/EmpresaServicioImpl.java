package com.vhela.inventario.servicio.empresa;

import com.vhela.inventario.dto.empresa.EmpresaCrearDTO;
import com.vhela.inventario.dto.empresa.EmpresaEditarDTO;
import com.vhela.inventario.dto.empresa.EmpresaObtenerDTO;
import com.vhela.inventario.dto.empresa.DashboardEmpresaDTO;
import com.vhela.inventario.dto.empresa.DashboardProductoCriticoDTO;
import com.vhela.inventario.dto.empresa.DashboardSucursalResumenDTO;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.inventario.InventarioSucursal;
import com.vhela.inventario.modelo.inventario.MovimientoInventario;
import com.vhela.inventario.modelo.inventario.enums.TipoMovimiento;
import com.vhela.inventario.modelo.sucursal.Sucursal;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.modelo.ventas.DetalleVenta;
import com.vhela.inventario.modelo.ventas.EstadoFactura;
import com.vhela.inventario.modelo.ventas.Venta;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.SucursalRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.repositorio.inventario.InventarioSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.venta.FacturaVentaRepositorio;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class EmpresaServicioImpl implements EmpresaServicio {

    private final EmpresaRepositorio empresaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final InventarioSucursalRepositorio inventarioSucursalRepositorio;
    private final FacturaVentaRepositorio facturaVentaRepositorio;
    private final MovimientoInventarioRepositorio movimientoInventarioRepositorio;

    @Override
    public EmpresaObtenerDTO crear(Long usuarioId, EmpresaCrearDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo el SUPER_ADMIN puede crear empresas");
        }

        Empresa empresa = new Empresa();

        empresa.setNombre(dto.getNombre());
        empresa.setCorreo(dto.getCorreo());
        empresa.setNit(dto.getNit());
        empresa.setDireccion(dto.getDireccion());
        empresa.setTelefono(dto.getTelefono());

        Empresa guardada = empresaRepositorio.save(empresa);

        return mapToDTO(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return empresaRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (usuario.getEmpresa() == null) {
                throw new RuntimeException("El usuario no tiene empresa asignada");
            }

            return List.of(mapToDTO(usuario.getEmpresa()));
        }

        throw new RuntimeException("No tiene permisos para ver empresas");
    }

    @Override
    @Transactional(readOnly = true)
    public EmpresaObtenerDTO obtenerPorId(Long usuarioId, Long idEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToDTO(empresa);
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (usuario.getEmpresa() == null) {
                throw new RuntimeException("El usuario no tiene empresa asignada");
            }

            if (!usuario.getEmpresa().getId().equals(idEmpresa)) {
                throw new RuntimeException("No puede ver esta empresa");
            }

            return mapToDTO(empresa);
        }

        throw new RuntimeException("No tiene permisos");
    }

    @Override
    @Transactional(readOnly = true)
    public EmpresaObtenerDTO obtenerPorNit(Long usuarioId, String nitEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        Empresa empresa = empresaRepositorio.findByNit(nitEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return mapToDTO(empresa);
        }

        if (usuario.getRol() == RolEnum.ADMIN) {
            if (usuario.getEmpresa() == null) {
                throw new RuntimeException("El usuario no tiene empresa asignada");
            }

            if (!usuario.getEmpresa().getNit().equals(nitEmpresa)) {
                throw new RuntimeException("No puede ver esta empresa");
            }

            return mapToDTO(empresa);
        }

        throw new RuntimeException("No tiene permisos");
    }

    @Override
    public EmpresaObtenerDTO editar(Long usuarioId, Long idEmpresa, EmpresaEditarDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede editar empresas");
        }

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        if (!empresa.getNit().equals(dto.getNit()) &&
                empresaRepositorio.findByNit(dto.getNit()).isPresent()) {
            throw new RuntimeException("Ya existe otra empresa con ese NIT");
        }

        empresa.setNombre(dto.getNombre());
        empresa.setNit(dto.getNit());
        empresa.setCorreo(dto.getCorreo());
        empresa.setTelefono(dto.getTelefono());
        empresa.setDireccion(dto.getDireccion());

        Empresa actualizada = empresaRepositorio.save(empresa);

        return mapToDTO(actualizada);
    }

    @Override
    public void eliminarPorId(Long usuarioId, Long idEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede eliminar empresas");
        }

        Empresa empresa = empresaRepositorio.findById(idEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        empresaRepositorio.delete(empresa);
    }

    @Override
    public void eliminarPorNit(Long usuarioId, String nitEmpresa) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no existe"));

        if (usuario.getRol() != RolEnum.SUPER_ADMIN) {
            throw new RuntimeException("Solo SUPER_ADMIN puede eliminar empresas");
        }

        Empresa empresa = empresaRepositorio.findByNit(nitEmpresa)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        empresaRepositorio.delete(empresa);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardEmpresaDTO obtenerDashboardEmpresa(
            Long usuarioId,
            Long empresaId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        validarAccesoDashboardEmpresa(usuario, empresa.getId());

        validarRangoDashboardEmpresa(fechaInicio, fechaFin);

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.plusDays(1).atStartOfDay().minusNanos(1);

        List<Sucursal> sucursales = sucursalRepositorio.findByEmpresaId(empresaId);

        List<InventarioSucursal> inventarioEmpresa =
                inventarioSucursalRepositorio.findBySucursal_Empresa_Id(empresaId);

        List<Venta> ventasEmpresa =
                facturaVentaRepositorio.findByEmpresa_IdAndFechaVentaBetweenOrderByFechaVentaDesc(
                        empresaId,
                        inicio,
                        fin
                );

        List<MovimientoInventario> ajustesNegativos =
                movimientoInventarioRepositorio.findBySucursal_Empresa_IdAndTipoAndFechaBetweenOrderByFechaDesc(
                        empresaId,
                        TipoMovimiento.AJUSTE_NEGATIVO,
                        inicio,
                        fin
                );

        DashboardEmpresaDTO dashboard = new DashboardEmpresaDTO();

        dashboard.setEmpresaId(empresa.getId());
        dashboard.setEmpresaNombre(empresa.getNombre());
        dashboard.setFechaInicio(fechaInicio);
        dashboard.setFechaFin(fechaFin);
        dashboard.setCantidadSucursales(sucursales.size());

        Map<Long, DashboardSucursalResumenDTO> resumenPorSucursal = new LinkedHashMap<>();

        for (Sucursal sucursal : sucursales) {
            DashboardSucursalResumenDTO resumen = new DashboardSucursalResumenDTO();

            resumen.setSucursalId(sucursal.getId());
            resumen.setSucursalNombre(sucursal.getNombre());

            resumen.setUnidadesInventario(0);
            resumen.setReferenciasInventario(0);
            resumen.setProductosAgotados(0);
            resumen.setProductosBajoStock(0);

            resumen.setCostoInventario(BigDecimal.ZERO);
            resumen.setValorComercialInventario(BigDecimal.ZERO);
            resumen.setUtilidadProyectadaInventario(BigDecimal.ZERO);

            resumen.setFacturasEmitidas(0);
            resumen.setFacturasActivas(0);
            resumen.setFacturasCanceladas(0);

            resumen.setVentasBrutas(BigDecimal.ZERO);
            resumen.setDescuentos(BigDecimal.ZERO);
            resumen.setVentasNetas(BigDecimal.ZERO);

            resumen.setCostoVendido(BigDecimal.ZERO);
            resumen.setUtilidadBruta(BigDecimal.ZERO);

            resumen.setCostoAjustesNegativos(BigDecimal.ZERO);
            resumen.setUnidadesAjustadasNegativas(0);

            resumen.setResultadoOperativoEstimado(BigDecimal.ZERO);

            resumenPorSucursal.put(sucursal.getId(), resumen);
        }

        int unidadesInventarioTotal = 0;
        int referenciasInventarioTotal = 0;
        int productosAgotados = 0;
        int productosBajoStock = 0;
        int productosAltoStock = 0;

        BigDecimal costoInventarioTotal = BigDecimal.ZERO;
        BigDecimal valorComercialInventarioTotal = BigDecimal.ZERO;

        List<DashboardProductoCriticoDTO> productosCriticos = new ArrayList<>();

        int limiteBajoStock = 5;
        int limiteAltoStock = 50;

        for (InventarioSucursal inventario : inventarioEmpresa) {

            if (inventario.getSucursal() == null || inventario.getProducto() == null) {
                continue;
            }

            Long sucursalId = inventario.getSucursal().getId();

            DashboardSucursalResumenDTO resumenSucursal =
                    resumenPorSucursal.get(sucursalId);

            if (resumenSucursal == null) {
                continue;
            }

            int stock = inventario.getStockActual() == null
                    ? 0
                    : inventario.getStockActual();

            BigDecimal costoUnitario = obtenerBigDecimalSeguro(
                    inventario.getProducto().getCostoUnitario()
            );

            BigDecimal precioVenta = obtenerBigDecimalSeguro(
                    inventario.getProducto().getPrecioVenta()
            );

            BigDecimal valorCosto = costoUnitario.multiply(
                    BigDecimal.valueOf(stock)
            );

            BigDecimal valorComercial = precioVenta.multiply(
                    BigDecimal.valueOf(stock)
            );

            unidadesInventarioTotal += stock;
            referenciasInventarioTotal++;

            costoInventarioTotal = costoInventarioTotal.add(valorCosto);
            valorComercialInventarioTotal = valorComercialInventarioTotal.add(valorComercial);

            resumenSucursal.setUnidadesInventario(
                    resumenSucursal.getUnidadesInventario() + stock
            );

            resumenSucursal.setReferenciasInventario(
                    resumenSucursal.getReferenciasInventario() + 1
            );

            resumenSucursal.setCostoInventario(
                    resumenSucursal.getCostoInventario().add(valorCosto)
            );

            resumenSucursal.setValorComercialInventario(
                    resumenSucursal.getValorComercialInventario().add(valorComercial)
            );

            resumenSucursal.setUtilidadProyectadaInventario(
                    resumenSucursal.getValorComercialInventario()
                            .subtract(resumenSucursal.getCostoInventario())
            );

            if (stock == 0) {
                productosAgotados++;

                resumenSucursal.setProductosAgotados(
                        resumenSucursal.getProductosAgotados() + 1
                );

                productosCriticos.add(
                        construirProductoCritico(
                                inventario,
                                valorCosto,
                                valorComercial,
                                "AGOTADO"
                        )
                );
            }

            if (stock > 0 && stock <= limiteBajoStock) {
                productosBajoStock++;

                resumenSucursal.setProductosBajoStock(
                        resumenSucursal.getProductosBajoStock() + 1
                );

                productosCriticos.add(
                        construirProductoCritico(
                                inventario,
                                valorCosto,
                                valorComercial,
                                "BAJO_STOCK"
                        )
                );
            }

            if (stock >= limiteAltoStock) {
                productosAltoStock++;
            }
        }

        int facturasEmitidas = ventasEmpresa.size();
        int facturasActivas = 0;
        int facturasCanceladas = 0;
        int facturasDevueltasParcial = 0;
        int facturasDevueltasTotal = 0;

        int productosVendidos = 0;
        int productosDevueltos = 0;

        BigDecimal ventasBrutas = BigDecimal.ZERO;
        BigDecimal descuentos = BigDecimal.ZERO;
        BigDecimal ventasNetas = BigDecimal.ZERO;
        BigDecimal costoVendido = BigDecimal.ZERO;
        BigDecimal valorCancelado = BigDecimal.ZERO;
        BigDecimal valorDevuelto = BigDecimal.ZERO;

        for (Venta venta : ventasEmpresa) {

            DashboardSucursalResumenDTO resumenSucursal =
                    resumenPorSucursal.get(venta.getSucursal().getId());

            if (resumenSucursal != null) {
                resumenSucursal.setFacturasEmitidas(
                        resumenSucursal.getFacturasEmitidas() + 1
                );
            }

            if (venta.getEstado() == EstadoFactura.CANCELADA) {
                facturasCanceladas++;

                valorCancelado = valorCancelado.add(
                        obtenerBigDecimalSeguro(venta.getTotal())
                );

                if (resumenSucursal != null) {
                    resumenSucursal.setFacturasCanceladas(
                            resumenSucursal.getFacturasCanceladas() + 1
                    );
                }

                continue;
            }

            if (venta.getEstado() == EstadoFactura.ACTIVA) {
                facturasActivas++;

                if (resumenSucursal != null) {
                    resumenSucursal.setFacturasActivas(
                            resumenSucursal.getFacturasActivas() + 1
                    );
                }
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

                int cantidadVendida = detalle.getCantidad() == null
                        ? 0
                        : detalle.getCantidad();

                int cantidadDevuelta = detalle.getCantidadDevuelta() == null
                        ? 0
                        : detalle.getCantidadDevuelta();

                int cantidadEfectiva = cantidadVendida - cantidadDevuelta;

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

                BigDecimal descuentoDevuelto = calcularDescuentoProporcional(
                        subtotalVenta,
                        descuentoVenta,
                        brutoDetalleDevuelto
                );

                BigDecimal netoDevueltoDetalle =
                        brutoDetalleDevuelto.subtract(descuentoDevuelto);

                ventaBrutaEfectiva = ventaBrutaEfectiva.add(brutoDetalleEfectivo);
                costoEfectivo = costoEfectivo.add(costoDetalleEfectivo);
                valorDevueltoVenta = valorDevueltoVenta.add(netoDevueltoDetalle);

                productosVendidosVenta += cantidadEfectiva;
                productosDevueltos += cantidadDevuelta;
            }

            BigDecimal descuentoEfectivo = calcularDescuentoProporcional(
                    subtotalVenta,
                    descuentoVenta,
                    ventaBrutaEfectiva
            );

            BigDecimal ventaNetaEfectiva =
                    ventaBrutaEfectiva.subtract(descuentoEfectivo);

            ventasBrutas = ventasBrutas.add(ventaBrutaEfectiva);
            descuentos = descuentos.add(descuentoEfectivo);
            ventasNetas = ventasNetas.add(ventaNetaEfectiva);
            costoVendido = costoVendido.add(costoEfectivo);
            valorDevuelto = valorDevuelto.add(valorDevueltoVenta);

            productosVendidos += productosVendidosVenta;

            if (resumenSucursal != null) {
                resumenSucursal.setVentasBrutas(
                        resumenSucursal.getVentasBrutas().add(ventaBrutaEfectiva)
                );

                resumenSucursal.setDescuentos(
                        resumenSucursal.getDescuentos().add(descuentoEfectivo)
                );

                resumenSucursal.setVentasNetas(
                        resumenSucursal.getVentasNetas().add(ventaNetaEfectiva)
                );

                resumenSucursal.setCostoVendido(
                        resumenSucursal.getCostoVendido().add(costoEfectivo)
                );

                resumenSucursal.setUtilidadBruta(
                        resumenSucursal.getVentasNetas()
                                .subtract(resumenSucursal.getCostoVendido())
                );
            }
        }

        BigDecimal costoAjustesNegativos = BigDecimal.ZERO;
        int unidadesAjustadasNegativas = 0;

        for (MovimientoInventario movimiento : ajustesNegativos) {

            int cantidad = movimiento.getCantidad() == null
                    ? 0
                    : Math.abs(movimiento.getCantidad());

            BigDecimal costoUnitarioMomento = obtenerBigDecimalSeguro(
                    movimiento.getCostoUnitarioMomento()
            );

            BigDecimal costoMovimiento = costoUnitarioMomento.multiply(
                    BigDecimal.valueOf(cantidad)
            );

            costoAjustesNegativos = costoAjustesNegativos.add(costoMovimiento);
            unidadesAjustadasNegativas += cantidad;

            if (movimiento.getSucursal() != null) {
                DashboardSucursalResumenDTO resumenSucursal =
                        resumenPorSucursal.get(movimiento.getSucursal().getId());

                if (resumenSucursal != null) {
                    resumenSucursal.setCostoAjustesNegativos(
                            resumenSucursal.getCostoAjustesNegativos().add(costoMovimiento)
                    );

                    resumenSucursal.setUnidadesAjustadasNegativas(
                            resumenSucursal.getUnidadesAjustadasNegativas() + cantidad
                    );
                }
            }
        }

        for (DashboardSucursalResumenDTO resumen : resumenPorSucursal.values()) {
            resumen.setResultadoOperativoEstimado(
                    resumen.getUtilidadBruta()
                            .subtract(resumen.getCostoAjustesNegativos())
            );
        }

        BigDecimal utilidadBruta = ventasNetas.subtract(costoVendido);

        BigDecimal resultadoOperativoEstimado =
                utilidadBruta.subtract(costoAjustesNegativos);

        BigDecimal utilidadProyectadaInventario =
                valorComercialInventarioTotal.subtract(costoInventarioTotal);

        dashboard.setUnidadesInventarioTotal(unidadesInventarioTotal);
        dashboard.setReferenciasInventarioTotal(referenciasInventarioTotal);

        dashboard.setProductosAgotados(productosAgotados);
        dashboard.setProductosBajoStock(productosBajoStock);
        dashboard.setProductosAltoStock(productosAltoStock);

        dashboard.setCostoInventarioTotal(costoInventarioTotal);
        dashboard.setValorComercialInventarioTotal(valorComercialInventarioTotal);
        dashboard.setUtilidadProyectadaInventario(utilidadProyectadaInventario);

        dashboard.setFacturasEmitidas(facturasEmitidas);
        dashboard.setFacturasActivas(facturasActivas);
        dashboard.setFacturasCanceladas(facturasCanceladas);
        dashboard.setFacturasDevueltasParcial(facturasDevueltasParcial);
        dashboard.setFacturasDevueltasTotal(facturasDevueltasTotal);

        dashboard.setProductosVendidos(productosVendidos);
        dashboard.setProductosDevueltos(productosDevueltos);

        dashboard.setVentasBrutas(ventasBrutas);
        dashboard.setDescuentos(descuentos);
        dashboard.setVentasNetas(ventasNetas);

        dashboard.setCostoVendido(costoVendido);
        dashboard.setUtilidadBruta(utilidadBruta);

        dashboard.setValorCancelado(valorCancelado);
        dashboard.setValorDevuelto(valorDevuelto);

        dashboard.setCostoAjustesNegativos(costoAjustesNegativos);
        dashboard.setUnidadesAjustadasNegativas(unidadesAjustadasNegativas);

        dashboard.setResultadoOperativoEstimado(resultadoOperativoEstimado);

        dashboard.setMargenUtilidadBruta(
                calcularPorcentaje(utilidadBruta, ventasNetas)
        );

        dashboard.setMargenOperativo(
                calcularPorcentaje(resultadoOperativoEstimado, ventasNetas)
        );

        List<DashboardSucursalResumenDTO> sucursalesResumen =
                resumenPorSucursal.values()
                        .stream()
                        .toList();

        dashboard.setSucursales(sucursalesResumen);

        dashboard.setMejorSucursalVentas(
                sucursalesResumen.stream()
                        .max(Comparator.comparing(DashboardSucursalResumenDTO::getVentasNetas))
                        .orElse(null)
        );

        dashboard.setMejorSucursalUtilidad(
                sucursalesResumen.stream()
                        .max(Comparator.comparing(DashboardSucursalResumenDTO::getUtilidadBruta))
                        .orElse(null)
        );

        dashboard.setSucursalMayorInventario(
                sucursalesResumen.stream()
                        .max(Comparator.comparing(DashboardSucursalResumenDTO::getValorComercialInventario))
                        .orElse(null)
        );

        dashboard.setSucursalMasAjustesNegativos(
                sucursalesResumen.stream()
                        .max(Comparator.comparing(DashboardSucursalResumenDTO::getCostoAjustesNegativos))
                        .orElse(null)
        );

        dashboard.setProductosCriticos(
                productosCriticos.stream()
                        .sorted(
                                Comparator.comparing(
                                        DashboardProductoCriticoDTO::getValorComercialTotal
                                ).reversed()
                        )
                        .limit(30)
                        .toList()
        );

        return dashboard;
    }

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private void validarAccesoDashboardEmpresa(
            Usuario usuario,
            Long empresaId
    ) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }

        if (!usuario.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puedes consultar información de otra empresa");
        }
    }

    private void validarRangoDashboardEmpresa(
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
            throw new RuntimeException("El rango del dashboard no puede superar 12 meses");
        }
    }

    private BigDecimal obtenerBigDecimalSeguro(BigDecimal valor) {

        return valor == null
                ? BigDecimal.ZERO
                : valor;
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

    private BigDecimal calcularPorcentaje(
            BigDecimal valor,
            BigDecimal base
    ) {

        if (base == null || base.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (valor == null) {
            return BigDecimal.ZERO;
        }

        return valor.multiply(BigDecimal.valueOf(100))
                .divide(base, 2, RoundingMode.HALF_UP);
    }

    private DashboardProductoCriticoDTO construirProductoCritico(
            InventarioSucursal inventario,
            BigDecimal valorCostoTotal,
            BigDecimal valorComercialTotal,
            String tipoAlerta
    ) {

        DashboardProductoCriticoDTO dto = new DashboardProductoCriticoDTO();

        dto.setProductoId(inventario.getProducto().getId());
        dto.setCodigo(inventario.getProducto().getCodigo());
        dto.setNombre(inventario.getProducto().getNombre());

        dto.setSucursalId(inventario.getSucursal().getId());
        dto.setSucursalNombre(inventario.getSucursal().getNombre());

        dto.setStockActual(
                inventario.getStockActual() == null
                        ? 0
                        : inventario.getStockActual()
        );

        dto.setCostoUnitario(
                obtenerBigDecimalSeguro(inventario.getProducto().getCostoUnitario())
        );

        dto.setPrecioVenta(
                obtenerBigDecimalSeguro(inventario.getProducto().getPrecioVenta())
        );

        dto.setValorCostoTotal(valorCostoTotal);
        dto.setValorComercialTotal(valorComercialTotal);
        dto.setTipoAlerta(tipoAlerta);

        return dto;
    }

    private EmpresaObtenerDTO mapToDTO(Empresa empresa) {

        EmpresaObtenerDTO dto = new EmpresaObtenerDTO();

        dto.setId(empresa.getId());
        dto.setNombre(empresa.getNombre());
        dto.setNit(empresa.getNit());
        dto.setCorreo(empresa.getCorreo());
        dto.setDireccion(empresa.getDireccion());
        dto.setTelefono(empresa.getTelefono());
        dto.setFechaCreacion(empresa.getFechaCreacion());

        return dto;
    }
}