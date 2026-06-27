package com.example.vhelasoft.repositorio;

import com.example.vhelasoft.modelo.usuario.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {
    
    Optional<Usuario> findByUsername(String username);

    List<Usuario> findBySucursalId(Long sucursalId);

    List<Usuario> findBySucursalFabricaId(Long fabricaId);

    long countBySucursalId(Long sucursalId);
}
