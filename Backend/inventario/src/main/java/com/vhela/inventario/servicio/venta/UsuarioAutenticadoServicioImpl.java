package com.vhela.inventario.servicio.venta;


import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioAutenticadoServicioImpl implements UsuarioAutenticadoServicio {

    private final UsuarioRepositorio usuarioRepositorio;

    @Override
    public Usuario obtenerUsuario(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado");
        }

        String username = authentication.getName();

        return usuarioRepositorio.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    @Override
    public Long obtenerUsuarioId(Authentication authentication) {
        return obtenerUsuario(authentication).getId();
    }
}
