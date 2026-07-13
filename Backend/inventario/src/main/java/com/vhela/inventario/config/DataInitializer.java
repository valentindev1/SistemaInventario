package com.vhela.inventario.config;

import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.root.name}")
    private String rootName;

    @Value("${app.root.username}")
    private String rootUsername;

    @Value("${app.root.password}")
    private String rootPassword;

    @Override
    public void run(String... args) {

        if (usuarioRepositorio.count() > 0) {
            return;
        }

        if (rootPassword == null || rootPassword.isBlank()) {
            System.out.println("Usuario ROOT no creado. ROOT_USER_PASSWORD no esta configurada.");
            return;
        }

        Usuario root = new Usuario();

        root.setNombre(rootName);
        root.setUsername(rootUsername);
        root.setPassword(passwordEncoder.encode(rootPassword));
        root.setRol(RolEnum.SUPER_ADMIN);

        root.setEmpresa(null);
        root.setSucursal(null);

        usuarioRepositorio.save(root);

        System.out.println("Usuario ROOT creado automaticamente con password encriptado.");
    }
}