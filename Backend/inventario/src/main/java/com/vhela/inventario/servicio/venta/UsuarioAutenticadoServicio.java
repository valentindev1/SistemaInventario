package com.vhela.inventario.servicio.venta;


import com.vhela.inventario.modelo.usuario.Usuario;
import org.springframework.security.core.Authentication;

public interface UsuarioAutenticadoServicio {

    Usuario obtenerUsuario(Authentication authentication);

    Long obtenerUsuarioId(Authentication authentication);
}
