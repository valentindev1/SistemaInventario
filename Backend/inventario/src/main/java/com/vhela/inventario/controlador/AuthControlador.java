package com.vhela.inventario.controlador;

import com.vhela.inventario.dto.auth.AuthResponseDTO;
import com.vhela.inventario.dto.auth.LoginRequestDTO;
import com.vhela.inventario.servicio.auth.AuthServicio;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthControlador {

    private final AuthServicio authServicio;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(
            @Valid @RequestBody LoginRequestDTO request
    ) {
        return ResponseEntity.ok(
                authServicio.login(request)
        );
    }
}