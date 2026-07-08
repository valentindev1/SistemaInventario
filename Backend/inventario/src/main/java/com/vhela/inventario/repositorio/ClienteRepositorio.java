package com.vhela.inventario.repositorio;


import com.vhela.inventario.modelo.cliente.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClienteRepositorio extends JpaRepository<Cliente, Long> {



    boolean existsByNumeroDocumentoAndEmpresaId(
            String numeroDocumento,
            Long empresaId
    );

    Optional<Cliente> findByNumeroDocumentoAndEmpresaId(
            String numeroDocumento,
            Long empresaId
    );

    List<Cliente> findByEmpresaId(Long empresaId);

    List<Cliente> findByNumeroDocumento(String numeroDocumento);


}
