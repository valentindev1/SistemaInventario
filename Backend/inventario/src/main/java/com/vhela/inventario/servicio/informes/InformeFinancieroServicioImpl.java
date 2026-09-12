package com.vhela.inventario.servicio.informes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.informes.InformeFinancieroClasificacionDTO;
import com.vhela.inventario.dto.informes.InformeFinancieroEmpresaDTO;
import com.vhela.inventario.dto.informes.InformeFinancieroPeriodoDTO;
import com.vhela.inventario.dto.informes.InformeFinancieroSucursalDTO;
import com.vhela.inventario.dto.informes.InformeFinancieroTipoProductoDTO;
import com.vhela.inventario.modelo.contabilidad.RegistroContableSucursal;
import com.vhela.inventario.modelo.contabilidad.TipoRegistroContable;
import com.vhela.inventario.modelo.empresa.Empresa;
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
import com.vhela.inventario.repositorio.contabilidad.RegistroContableSucursalRepositorio;
import com.vhela.inventario.repositorio.inventario.MovimientoInventarioRepositorio;
import com.vhela.inventario.repositorio.venta.FacturaVentaRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InformeFinancieroServicioImpl implements InformeFinancieroServicio {

    private static final String AJUSTES_INVENTARIO = "Pérdidas por ajustes de inventario";

    private final UsuarioRepositorio usuarioRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final SucursalRepositorio sucursalRepositorio;
    private final FacturaVentaRepositorio facturaVentaRepositorio;
    private final RegistroContableSucursalRepositorio registroContableRepositorio;
    private final MovimientoInventarioRepositorio movimientoInventarioRepositorio;

    @Override
    public InformeFinancieroEmpresaDTO generar(
            Long usuarioId,
            Long empresaId,
            Long sucursalId,
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Empresa empresa = empresaRepositorio.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        validarAcceso(usuario, empresaId);
        validarRango(fechaInicio, fechaFin);

        Sucursal sucursalSeleccionada = resolverSucursal(empresaId, sucursalId);
        List<Sucursal> sucursales = sucursalSeleccionada == null
                ? sucursalRepositorio.findByEmpresaId(empresaId)
                : List.of(sucursalSeleccionada);

        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.plusDays(1).atStartOfDay().minusNanos(1);

        List<Venta> ventas = sucursalSeleccionada == null
                ? facturaVentaRepositorio.findByEmpresa_IdAndFechaVentaBetweenOrderByFechaVentaDesc(
                        empresaId, inicio, fin)
                : facturaVentaRepositorio.findBySucursalAndFechaVentaBetweenOrderByFechaVentaDesc(
                        sucursalSeleccionada, inicio, fin);

        List<RegistroContableSucursal> registros = sucursalSeleccionada == null
                ? registroContableRepositorio
                        .findBySucursal_Empresa_IdAndFechaBetweenOrderByFechaAsc(
                                empresaId, fechaInicio, fechaFin)
                : registroContableRepositorio.findBySucursalIdAndFechaBetweenOrderByFechaAsc(
                        sucursalSeleccionada.getId(), fechaInicio, fechaFin);

        List<MovimientoInventario> ajustesNegativos = sucursalSeleccionada == null
                ? movimientoInventarioRepositorio
                        .findBySucursal_Empresa_IdAndTipoAndFechaBetweenOrderByFechaDesc(
                                empresaId, TipoMovimiento.AJUSTE_NEGATIVO, inicio, fin)
                : movimientoInventarioRepositorio.findBySucursalAndTipoAndFechaBetweenOrderByFechaDesc(
                        sucursalSeleccionada, TipoMovimiento.AJUSTE_NEGATIVO, inicio, fin);

        AcumuladoFinanciero total = new AcumuladoFinanciero();
        Map<String, AcumuladoFinanciero> porPeriodo = inicializarPeriodos(fechaInicio, fechaFin);
        Map<Long, AcumuladoFinanciero> porSucursal = new LinkedHashMap<>();
        Map<Long, String> nombresSucursal = new LinkedHashMap<>();
        for (Sucursal sucursal : sucursales) {
            porSucursal.put(sucursal.getId(), new AcumuladoFinanciero());
            nombresSucursal.put(sucursal.getId(), sucursal.getNombre());
        }

        TipoProductoAcumulado remanufacturados = new TipoProductoAcumulado();
        TipoProductoAcumulado convencionales = new TipoProductoAcumulado();
        Map<String, ClasificacionAcumulada> egresosClasificados = new LinkedHashMap<>();

        agregarVentas(
                ventas,
                total,
                porPeriodo,
                porSucursal,
                remanufacturados,
                convencionales
        );
        agregarRegistrosContables(
                registros,
                total,
                porPeriodo,
                porSucursal,
                egresosClasificados
        );
        agregarAjustes(
                ajustesNegativos,
                total,
                porPeriodo,
                porSucursal,
                egresosClasificados
        );

        InformeFinancieroEmpresaDTO informe = mapearInforme(
                empresa,
                sucursalSeleccionada,
                fechaInicio,
                fechaFin,
                sucursales.size(),
                total
        );
        informe.setPeriodos(mapearPeriodos(porPeriodo));
        informe.setSucursales(mapearSucursales(porSucursal, nombresSucursal));
        informe.setEgresosPorClasificacion(
                mapearClasificaciones(egresosClasificados, total.egresosOperativos())
        );
        informe.setProductosRemanufacturados(
                mapearTipoProducto("REMANUFACTURADOS", remanufacturados)
        );
        informe.setProductosConvencionales(
                mapearTipoProducto("CONVENCIONALES", convencionales)
        );

        // El módulo CompraVariasSucursal es deliberadamente independiente y no
        // participa en ninguna consulta ni operación de este informe.
        informe.setComprasVariasIncluidas(false);
        return informe;
    }

    private void agregarVentas(
            List<Venta> ventas,
            AcumuladoFinanciero total,
            Map<String, AcumuladoFinanciero> porPeriodo,
            Map<Long, AcumuladoFinanciero> porSucursal,
            TipoProductoAcumulado remanufacturados,
            TipoProductoAcumulado convencionales
    ) {
        for (Venta venta : ventas) {
            AcumuladoFinanciero periodo = porPeriodo.get(
                    YearMonth.from(venta.getFechaVenta()).toString()
            );
            AcumuladoFinanciero sucursal = porSucursal.get(venta.getSucursal().getId());

            total.facturasEmitidas++;
            if (venta.getEstado() == EstadoFactura.CANCELADA) {
                total.facturasCanceladas++;
                continue;
            }

            total.facturasEfectivas++;
            if (periodo != null) {
                periodo.facturasEfectivas++;
            }
            if (sucursal != null) {
                sucursal.facturasEfectivas++;
            }

            BigDecimal subtotalVenta = seguro(venta.getSubtotal());
            BigDecimal descuentoVenta = seguro(venta.getDescuento());

            for (DetalleVenta detalle : venta.getDetalles()) {
                int cantidadVendida = detalle.getCantidad() == null ? 0 : detalle.getCantidad();
                int cantidadDevuelta = detalle.getCantidadDevuelta() == null
                        ? 0
                        : detalle.getCantidadDevuelta();
                int cantidadEfectiva = Math.max(0, cantidadVendida - cantidadDevuelta);

                BigDecimal bruto = seguro(detalle.getPrecioUnitarioMomento())
                        .multiply(BigDecimal.valueOf(cantidadEfectiva));
                BigDecimal costo = seguro(detalle.getCostoUnitarioMomento())
                        .multiply(BigDecimal.valueOf(cantidadEfectiva));
                BigDecimal descuento = calcularDescuentoProporcional(
                        subtotalVenta,
                        descuentoVenta,
                        bruto
                );
                BigDecimal ingresoNeto = bruto.subtract(descuento);

                total.sumarVenta(cantidadEfectiva, cantidadDevuelta, bruto, descuento, costo);
                if (periodo != null) {
                    periodo.sumarVenta(cantidadEfectiva, cantidadDevuelta, bruto, descuento, costo);
                }
                if (sucursal != null) {
                    sucursal.sumarVenta(cantidadEfectiva, cantidadDevuelta, bruto, descuento, costo);
                }

                boolean esRemanufacturado = detalle.getRemanufacturadoMomento() != null
                        ? detalle.getRemanufacturadoMomento()
                        : detalle.getProducto() != null
                                && Boolean.TRUE.equals(detalle.getProducto().getEsRemanufacturado());
                TipoProductoAcumulado tipoProducto = esRemanufacturado
                        ? remanufacturados
                        : convencionales;
                tipoProducto.sumar(cantidadEfectiva, ingresoNeto, costo);
            }
        }
    }

    private void agregarRegistrosContables(
            List<RegistroContableSucursal> registros,
            AcumuladoFinanciero total,
            Map<String, AcumuladoFinanciero> porPeriodo,
            Map<Long, AcumuladoFinanciero> porSucursal,
            Map<String, ClasificacionAcumulada> egresosClasificados
    ) {
        for (RegistroContableSucursal registro : registros) {
            BigDecimal valor = seguro(registro.getValor());
            boolean esCosto = registro.getTipo() == TipoRegistroContable.COSTO;

            total.sumarRegistro(esCosto, valor);
            AcumuladoFinanciero periodo = porPeriodo.get(YearMonth.from(registro.getFecha()).toString());
            if (periodo != null) {
                periodo.sumarRegistro(esCosto, valor);
            }
            AcumuladoFinanciero sucursal = porSucursal.get(registro.getSucursal().getId());
            if (sucursal != null) {
                sucursal.sumarRegistro(esCosto, valor);
            }

            String clasificacion = obtenerNombreClasificacion(registro);
            String tipo = esCosto ? "COSTO INDIRECTO" : "GASTO";
            String clave = tipo + "|" + clasificacion.toUpperCase(Locale.ROOT);
            egresosClasificados.computeIfAbsent(
                    clave,
                    ignored -> new ClasificacionAcumulada(tipo, clasificacion)
            ).sumar(valor);
        }
    }

    private void agregarAjustes(
            List<MovimientoInventario> ajustes,
            AcumuladoFinanciero total,
            Map<String, AcumuladoFinanciero> porPeriodo,
            Map<Long, AcumuladoFinanciero> porSucursal,
            Map<String, ClasificacionAcumulada> egresosClasificados
    ) {
        BigDecimal totalAjustes = BigDecimal.ZERO;
        for (MovimientoInventario ajuste : ajustes) {
            int cantidad = ajuste.getCantidad() == null ? 0 : Math.abs(ajuste.getCantidad());
            BigDecimal valor = seguro(ajuste.getCostoUnitarioMomento())
                    .multiply(BigDecimal.valueOf(cantidad));
            total.perdidasAjustesInventario = total.perdidasAjustesInventario.add(valor);
            totalAjustes = totalAjustes.add(valor);

            AcumuladoFinanciero periodo = porPeriodo.get(
                    YearMonth.from(ajuste.getFecha()).toString()
            );
            if (periodo != null) {
                periodo.perdidasAjustesInventario =
                        periodo.perdidasAjustesInventario.add(valor);
            }
            if (ajuste.getSucursal() != null) {
                AcumuladoFinanciero sucursal = porSucursal.get(ajuste.getSucursal().getId());
                if (sucursal != null) {
                    sucursal.perdidasAjustesInventario =
                            sucursal.perdidasAjustesInventario.add(valor);
                }
            }
        }

        if (totalAjustes.compareTo(BigDecimal.ZERO) > 0) {
            egresosClasificados.put(
                    "AJUSTE|" + AJUSTES_INVENTARIO.toUpperCase(Locale.ROOT),
                    new ClasificacionAcumulada("AJUSTE", AJUSTES_INVENTARIO, totalAjustes)
            );
        }
    }

    private InformeFinancieroEmpresaDTO mapearInforme(
            Empresa empresa,
            Sucursal sucursal,
            LocalDate fechaInicio,
            LocalDate fechaFin,
            int cantidadSucursales,
            AcumuladoFinanciero total
    ) {
        InformeFinancieroEmpresaDTO dto = new InformeFinancieroEmpresaDTO();
        dto.setEmpresaId(empresa.getId());
        dto.setEmpresaNombre(empresa.getNombre());
        dto.setSucursalId(sucursal == null ? null : sucursal.getId());
        dto.setSucursalNombre(sucursal == null ? "Todas las sucursales" : sucursal.getNombre());
        dto.setFechaInicio(fechaInicio);
        dto.setFechaFin(fechaFin);
        dto.setCantidadSucursalesIncluidas(cantidadSucursales);
        dto.setFacturasEmitidas(total.facturasEmitidas);
        dto.setFacturasEfectivas(total.facturasEfectivas);
        dto.setFacturasCanceladas(total.facturasCanceladas);
        dto.setUnidadesVendidas(total.unidadesVendidas);
        dto.setUnidadesDevueltas(total.unidadesDevueltas);
        dto.setVentasBrutas(total.ventasBrutas);
        dto.setDescuentos(total.descuentos);
        dto.setIngresosNetos(total.ingresosNetos());
        dto.setCostoProductosVendidos(total.costoProductosVendidos);
        dto.setUtilidadBruta(total.utilidadBruta());
        dto.setCostosIndirectos(total.costosIndirectos);
        dto.setGastos(total.gastos);
        dto.setPerdidasAjustesInventario(total.perdidasAjustesInventario);
        dto.setEgresosOperativos(total.egresosOperativos());
        dto.setUtilidadNeta(total.utilidadNeta());
        dto.setMargenBruto(porcentaje(total.utilidadBruta(), total.ingresosNetos()));
        dto.setMargenNeto(porcentaje(total.utilidadNeta(), total.ingresosNetos()));
        return dto;
    }

    private List<InformeFinancieroPeriodoDTO> mapearPeriodos(
            Map<String, AcumuladoFinanciero> periodos
    ) {
        return periodos.entrySet().stream().map(entry -> {
            AcumuladoFinanciero valor = entry.getValue();
            InformeFinancieroPeriodoDTO dto = new InformeFinancieroPeriodoDTO();
            dto.setPeriodo(entry.getKey());
            dto.setFacturasEfectivas(valor.facturasEfectivas);
            dto.setUnidadesVendidas(valor.unidadesVendidas);
            dto.setIngresosNetos(valor.ingresosNetos());
            dto.setCostoProductosVendidos(valor.costoProductosVendidos);
            dto.setUtilidadBruta(valor.utilidadBruta());
            dto.setCostosIndirectos(valor.costosIndirectos);
            dto.setGastos(valor.gastos);
            dto.setPerdidasAjustesInventario(valor.perdidasAjustesInventario);
            dto.setUtilidadNeta(valor.utilidadNeta());
            return dto;
        }).toList();
    }

    private List<InformeFinancieroSucursalDTO> mapearSucursales(
            Map<Long, AcumuladoFinanciero> sucursales,
            Map<Long, String> nombres
    ) {
        return sucursales.entrySet().stream().map(entry -> {
            AcumuladoFinanciero valor = entry.getValue();
            InformeFinancieroSucursalDTO dto = new InformeFinancieroSucursalDTO();
            dto.setSucursalId(entry.getKey());
            dto.setSucursalNombre(nombres.get(entry.getKey()));
            dto.setFacturasEfectivas(valor.facturasEfectivas);
            dto.setUnidadesVendidas(valor.unidadesVendidas);
            dto.setIngresosNetos(valor.ingresosNetos());
            dto.setCostoProductosVendidos(valor.costoProductosVendidos);
            dto.setUtilidadBruta(valor.utilidadBruta());
            dto.setCostosIndirectos(valor.costosIndirectos);
            dto.setGastos(valor.gastos);
            dto.setPerdidasAjustesInventario(valor.perdidasAjustesInventario);
            dto.setUtilidadNeta(valor.utilidadNeta());
            return dto;
        }).sorted(
                Comparator.comparing(
                        InformeFinancieroSucursalDTO::getSucursalNombre,
                        String.CASE_INSENSITIVE_ORDER
                )
        ).toList();
    }

    private List<InformeFinancieroClasificacionDTO> mapearClasificaciones(
            Map<String, ClasificacionAcumulada> clasificaciones,
            BigDecimal totalEgresos
    ) {
        return clasificaciones.values().stream().map(valor -> {
            InformeFinancieroClasificacionDTO dto = new InformeFinancieroClasificacionDTO();
            dto.setTipo(valor.tipo);
            dto.setClasificacion(valor.nombre);
            dto.setValor(valor.valor);
            dto.setPorcentajeEgresos(porcentaje(valor.valor, totalEgresos));
            return dto;
        }).sorted(Comparator.comparing(
                InformeFinancieroClasificacionDTO::getValor,
                Comparator.reverseOrder()
        )).toList();
    }

    private InformeFinancieroTipoProductoDTO mapearTipoProducto(
            String tipo,
            TipoProductoAcumulado valor
    ) {
        InformeFinancieroTipoProductoDTO dto = new InformeFinancieroTipoProductoDTO();
        dto.setTipo(tipo);
        dto.setUnidadesVendidas(valor.unidadesVendidas);
        dto.setIngresosNetos(valor.ingresosNetos);
        dto.setCostoVendido(valor.costoVendido);
        dto.setUtilidadBruta(valor.ingresosNetos.subtract(valor.costoVendido));
        return dto;
    }

    private Map<String, AcumuladoFinanciero> inicializarPeriodos(
            LocalDate fechaInicio,
            LocalDate fechaFin
    ) {
        Map<String, AcumuladoFinanciero> periodos = new LinkedHashMap<>();
        YearMonth actual = YearMonth.from(fechaInicio);
        YearMonth ultimo = YearMonth.from(fechaFin);
        while (!actual.isAfter(ultimo)) {
            periodos.put(actual.toString(), new AcumuladoFinanciero());
            actual = actual.plusMonths(1);
        }
        return periodos;
    }

    private Sucursal resolverSucursal(Long empresaId, Long sucursalId) {
        if (sucursalId == null) {
            return null;
        }
        return sucursalRepositorio.findByIdAndEmpresaId(sucursalId, empresaId)
                .orElseThrow(() -> new RuntimeException(
                        "La sucursal seleccionada no pertenece a la empresa"
                ));
    }

    private void validarAcceso(Usuario usuario, Long empresaId) {
        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }
        if (usuario.getRol() == RolEnum.ADMIN
                && usuario.getEmpresa() != null
                && usuario.getEmpresa().getId().equals(empresaId)) {
            return;
        }
        throw new RuntimeException("No puede generar informes de otra empresa");
    }

    private void validarRango(LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaInicio == null || fechaFin == null) {
            throw new RuntimeException("Debe seleccionar fecha inicial y fecha final");
        }
        if (fechaFin.isBefore(fechaInicio)) {
            throw new RuntimeException("La fecha final no puede ser menor que la fecha inicial");
        }
    }

    private String obtenerNombreClasificacion(RegistroContableSucursal registro) {
        if (registro.getClasificacionNombre() != null
                && !registro.getClasificacionNombre().isBlank()) {
            return registro.getClasificacionNombre();
        }
        if (registro.getClasificacionContable() != null) {
            return registro.getClasificacionContable().getNombre();
        }
        if (registro.getClasificacion() != null) {
            return formatearEnum(registro.getClasificacion().name());
        }
        return "Sin clasificación";
    }

    private String formatearEnum(String valor) {
        String normalizado = valor.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(normalizado.charAt(0)) + normalizado.substring(1);
    }

    private BigDecimal calcularDescuentoProporcional(
            BigDecimal subtotal,
            BigDecimal descuento,
            BigDecimal valorBase
    ) {
        if (subtotal.compareTo(BigDecimal.ZERO) <= 0
                || descuento.compareTo(BigDecimal.ZERO) <= 0
                || valorBase.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return valorBase.multiply(descuento).divide(subtotal, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal porcentaje(BigDecimal valor, BigDecimal base) {
        if (base.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return valor.multiply(BigDecimal.valueOf(100))
                .divide(base, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal seguro(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    private static final class AcumuladoFinanciero {
        private int facturasEmitidas;
        private int facturasEfectivas;
        private int facturasCanceladas;
        private int unidadesVendidas;
        private int unidadesDevueltas;
        private BigDecimal ventasBrutas = BigDecimal.ZERO;
        private BigDecimal descuentos = BigDecimal.ZERO;
        private BigDecimal costoProductosVendidos = BigDecimal.ZERO;
        private BigDecimal costosIndirectos = BigDecimal.ZERO;
        private BigDecimal gastos = BigDecimal.ZERO;
        private BigDecimal perdidasAjustesInventario = BigDecimal.ZERO;

        private void sumarVenta(
                int unidades,
                int devueltas,
                BigDecimal bruto,
                BigDecimal descuento,
                BigDecimal costo
        ) {
            unidadesVendidas += unidades;
            unidadesDevueltas += devueltas;
            ventasBrutas = ventasBrutas.add(bruto);
            descuentos = descuentos.add(descuento);
            costoProductosVendidos = costoProductosVendidos.add(costo);
        }

        private void sumarRegistro(boolean esCosto, BigDecimal valor) {
            if (esCosto) {
                costosIndirectos = costosIndirectos.add(valor);
            } else {
                gastos = gastos.add(valor);
            }
        }

        private BigDecimal ingresosNetos() {
            return ventasBrutas.subtract(descuentos);
        }

        private BigDecimal utilidadBruta() {
            return ingresosNetos().subtract(costoProductosVendidos);
        }

        private BigDecimal egresosOperativos() {
            return costosIndirectos.add(gastos).add(perdidasAjustesInventario);
        }

        private BigDecimal utilidadNeta() {
            return utilidadBruta().subtract(egresosOperativos());
        }
    }

    private static final class TipoProductoAcumulado {
        private int unidadesVendidas;
        private BigDecimal ingresosNetos = BigDecimal.ZERO;
        private BigDecimal costoVendido = BigDecimal.ZERO;

        private void sumar(int unidades, BigDecimal ingresos, BigDecimal costo) {
            unidadesVendidas += unidades;
            ingresosNetos = ingresosNetos.add(ingresos);
            costoVendido = costoVendido.add(costo);
        }
    }

    private static final class ClasificacionAcumulada {
        private final String tipo;
        private final String nombre;
        private BigDecimal valor;

        private ClasificacionAcumulada(String tipo, String nombre) {
            this(tipo, nombre, BigDecimal.ZERO);
        }

        private ClasificacionAcumulada(String tipo, String nombre, BigDecimal valor) {
            this.tipo = tipo;
            this.nombre = nombre;
            this.valor = valor;
        }

        private void sumar(BigDecimal monto) {
            valor = valor.add(monto);
        }
    }
}
