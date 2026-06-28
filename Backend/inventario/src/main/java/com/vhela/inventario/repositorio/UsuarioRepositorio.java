package com.vhela.inventario.repositorio;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.vhela.inventario.modelo.usuario.Usuario;

public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);

    List<Usuario> findByEmpresaId(Long empresaId);

    List<Usuario> findBySucursalId(Long sucursalId);

    Optional<Usuario> findByIdAndEmpresaId(Long id, Long empresaId);

    Optional<Usuario> findByIdAndSucursalId(Long id, Long sucursalId);

}
