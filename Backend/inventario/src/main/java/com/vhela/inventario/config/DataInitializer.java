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

    @Value("${app.root.force-reset-password:false}")
    private boolean forceResetPassword;

    @Override
    public void run(String... args) {

        if (rootPassword == null || rootPassword.isBlank()) {
            System.out.println("Usuario ROOT no creado ni actualizado. ROOT_USER_PASSWORD no esta configurada.");
            return;
        }

        usuarioRepositorio.findByUsername(rootUsername).ifPresentOrElse(
                usuarioExistente -> {

                    if (forceResetPassword) {
                        usuarioExistente.setPassword(passwordEncoder.encode(rootPassword));
                        usuarioRepositorio.save(usuarioExistente);

                        System.out.println("Password del usuario ROOT actualizado desde variable de entorno.");
                    } else {
                        System.out.println("Usuario ROOT ya existe. No se actualizo password.");
                    }
                },
                () -> {
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
        );
    }
}