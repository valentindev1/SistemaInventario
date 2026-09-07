package com.vhela.inventario.controlador;

import java.util.List;
import java.time.LocalDate;

import com.vhela.inventario.dto.producto.producto.RankingProductosVentasDTO;
import com.vhela.inventario.dto.venta.*;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.servicio.venta.SoporteVentaPdfServicio;
import com.vhela.inventario.servicio.venta.UsuarioAutenticadoServicio;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.vhela.inventario.servicio.venta.VentaServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.vhela.inventario.dto.venta.soporte.SoporteVentaDTO;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
@RestController
@RequestMapping("/api/ventas")
@RequiredArgsConstructor
public class VentaControlador {

    private final VentaServicio ventaServicio;
    private final UsuarioAutenticadoServicio usuarioAutenticadoServicio;

    private final SoporteVentaPdfServicio soporteVentaPdfServicio;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<FacturaVentaDTO> crearVenta(
            @RequestParam Long usuarioId,
            @Valid @RequestBody CrearVentaDTO dto
    ) {
        FacturaVentaDTO response = ventaServicio.crearVenta(usuarioId, dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/{ventaId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<FacturaVentaDTO> obtenerPorId(
            @RequestParam Long usuarioId,
            @PathVariable Long ventaId
    ) {
        return ResponseEntity.ok(
                ventaServicio.obtenerPorId(usuarioId, ventaId)
        );
    }

    @GetMapping("/sucursal/{sucursalId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<List<FacturaVentaDTO>> listarPorSucursal(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId
    ) {
        return ResponseEntity.ok(
                ventaServicio.listarPorSucursal(usuarioId, sucursalId)
        );
    }

    @GetMapping("/numero/{numeroVenta}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<FacturaVentaDTO> obtenerPorNumero(
            @RequestParam Long usuarioId,
            @PathVariable String numeroVenta
    ) {
        return ResponseEntity.ok(
                ventaServicio.obtenerPorNumero(usuarioId, numeroVenta)
        );
    }

    @PutMapping("/{ventaId}/cancelar")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<FacturaVentaDTO> cancelarVenta(
            @RequestParam Long usuarioId,
            @PathVariable Long ventaId,
            @RequestBody CancelarVentaDTO dto
    ) {
        return ResponseEntity.ok(
                ventaServicio.cancelarVenta(
                        usuarioId,
                        ventaId,
                        dto.getMotivo()
                )
        );
    }


    @GetMapping("/ranking-productos/sucursal/{sucursalId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<RankingProductosVentasDTO> obtenerRankingProductosVentas(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaInicio,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaFin
    ) {
        return ResponseEntity.ok(
                ventaServicio.obtenerRankingProductosVentas(
                        usuarioId,
                        sucursalId,
                        fechaInicio,
                        fechaFin
                )
        );
    }




    @GetMapping("/informe-consolidado/sucursal/{sucursalId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<InformeConsolidadoVentasDTO> generarInformeConsolidado(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaInicio,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fechaFin
    ) {

        InformeConsolidadoVentasDTO informe =
                ventaServicio.generarInformeConsolidado(
                        usuarioId,
                        sucursalId,
                        fechaInicio,
                        fechaFin
                );

        return ResponseEntity.ok(informe);
    }



    @PostMapping("/{ventaId}/devoluciones")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<FacturaVentaDTO> generarDevolucion(
            @RequestParam Long usuarioId,
            @PathVariable Long ventaId,
            @Valid @RequestBody DevolucionVentaDTO dto
    ) {
        return ResponseEntity.ok(
                ventaServicio.generarDevolucion(usuarioId, ventaId, dto)
        );
    }


    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    @GetMapping("/sucursal/{sucursalId}/informe")
    public ResponseEntity<InformeVentasDTO> generarInformeVentas(
            @RequestParam Long usuarioId,
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "DIA") String periodo,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fecha
    ) {
        return ResponseEntity.ok(
                ventaServicio.generarInformeVentas(
                        usuarioId,
                        sucursalId,
                        periodo,
                        fecha
                )
        );
    }

    @GetMapping("/{ventaId}/soporte/pdf")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'EMPLEADO')")
    public ResponseEntity<byte[]> generarSoporteVentaPdf(
            @PathVariable Long ventaId,
            Authentication authentication
    ) {

        Long usuarioId = usuarioAutenticadoServicio.obtenerUsuarioId(authentication);

        SoporteVentaDTO soporte = ventaServicio.generarSoporteVenta(usuarioId, ventaId);

        byte[] pdf = soporteVentaPdfServicio.generarPdf(soporte);

        String nombreArchivo = "soporte-venta-" + soporte.getNumeroVenta() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=" + nombreArchivo)
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

}