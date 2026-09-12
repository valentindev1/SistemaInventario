package com.vhela.inventario.controlador.empleado;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vhela.inventario.dto.contabilidad.RegistroContableDTO;
import com.vhela.inventario.dto.contabilidad.RegistroGastoEmpleadoDTO;
import com.vhela.inventario.servicio.contabilidad.ContabilidadServicio;
import com.vhela.inventario.servicio.venta.UsuarioAutenticadoServicio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/empleado/contabilidad")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLEADO')")
public class EmpleadoContabilidadControlador {

    private final ContabilidadServicio contabilidadServicio;
    private final UsuarioAutenticadoServicio usuarioAutenticadoServicio;

    @GetMapping("/sucursal/{sucursalId}/gastos")
    public ResponseEntity<List<RegistroContableDTO>> listarGastos(
            Authentication authentication,
            @PathVariable Long sucursalId
    ) {
        return ResponseEntity.ok(
                contabilidadServicio.listarGastosEmpleado(
                        usuarioAutenticadoServicio.obtenerUsuarioId(authentication),
                        sucursalId
                )
        );
    }

    @PostMapping("/sucursal/{sucursalId}/gastos")
    public ResponseEntity<RegistroContableDTO> registrarGasto(
            Authentication authentication,
            @PathVariable Long sucursalId,
            @Valid @RequestBody RegistroGastoEmpleadoDTO dto
    ) {
        return ResponseEntity.status(201).body(
                contabilidadServicio.registrarGastoEmpleado(
                        usuarioAutenticadoServicio.obtenerUsuarioId(authentication),
                        sucursalId,
                        dto
                )
        );
    }

    @PutMapping("/sucursal/{sucursalId}/gastos/{registroId}")
    public ResponseEntity<RegistroContableDTO> editarGasto(
            Authentication authentication,
            @PathVariable Long sucursalId,
            @PathVariable Long registroId,
            @Valid @RequestBody RegistroGastoEmpleadoDTO dto
    ) {
        return ResponseEntity.ok(
                contabilidadServicio.editarGastoEmpleado(
                        usuarioAutenticadoServicio.obtenerUsuarioId(authentication),
                        sucursalId,
                        registroId,
                        dto
                )
        );
    }

    @DeleteMapping("/sucursal/{sucursalId}/gastos/{registroId}")
    public ResponseEntity<Void> eliminarGasto(
            Authentication authentication,
            @PathVariable Long sucursalId,
            @PathVariable Long registroId
    ) {
        contabilidadServicio.eliminarGastoEmpleado(
                usuarioAutenticadoServicio.obtenerUsuarioId(authentication),
                sucursalId,
                registroId
        );
        return ResponseEntity.noContent().build();
    }
}
