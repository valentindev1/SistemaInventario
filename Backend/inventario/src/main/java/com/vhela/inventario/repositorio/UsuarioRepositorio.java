package com.vhela.inventario.repositorio;


import com.vhela.inventario.modelo.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    // Usuarios por sucursal
    List<Usuario> findBySucursalId(Long sucursalId);

    // Usuarios por empresa (a través de sucursal)
    List<Usuario> findBySucursalEmpresaId(Long empresaId);
}
