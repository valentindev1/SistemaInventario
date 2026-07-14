package com.vhela.inventario.servicio.auth;

import com.vhela.inventario.dto.auth.AuthResponseDTO;
import com.vhela.inventario.dto.auth.LoginRequestDTO;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import com.vhela.inventario.security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;


    public AuthResponseDTO login(LoginRequestDTO request) {



        Usuario usuario = usuarioRepositorio.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Credenciales inválidas"));


        boolean passwordValido = passwordEncoder.matches(
                request.getPassword(),
                usuario.getPassword()
        );



        if (!passwordValido) {
            throw new RuntimeException("Credenciales inválidas");
        }

        Long empresaId = usuario.getEmpresa() != null
                ? usuario.getEmpresa().getId()
                : null;

        Long sucursalId = usuario.getSucursal() != null
                ? usuario.getSucursal().getId()
                : null;

        Map<String, Object> claims = new HashMap<>();

        claims.put("usuarioId", usuario.getId());
        claims.put("nombre", usuario.getNombre());
        claims.put("rol", usuario.getRol().name());

        if (empresaId != null) {
            claims.put("empresaId", empresaId);
        }

        if (sucursalId != null) {
            claims.put("sucursalId", sucursalId);
        }

        String token = jwtService.generateToken(
                claims,
                usuario.getUsername()
        );

        return AuthResponseDTO.builder()
                .token(token)
                .tipo("Bearer")
                .usuarioId(usuario.getId())
                .username(usuario.getUsername())
                .nombre(usuario.getNombre())
                .rol(usuario.getRol().name())
                .empresaId(empresaId)
                .sucursalId(sucursalId)
                .build();
    }

}