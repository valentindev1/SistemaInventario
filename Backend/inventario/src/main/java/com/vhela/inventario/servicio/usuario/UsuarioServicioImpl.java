package com.example.vhelasoft.servicio.fabrica.usuario;

import com.example.vhelasoft.dto.usuario.UsuarioCrearDTO;
import com.example.vhelasoft.dto.usuario.UsuarioEditarDTO;
import com.example.vhelasoft.dto.usuario.UsuarioResponseDTO;
import com.example.vhelasoft.modelo.sucursal.Sucursal;
import com.example.vhelasoft.modelo.usuario.RolEnum;
import com.example.vhelasoft.modelo.usuario.Usuario;
import com.example.vhelasoft.repositorio.SucursalRepositorio;
import com.example.vhelasoft.repositorio.UsuarioRepositorio;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional

public class UsuarioServicioImpl implements UsuarioServicio {


    private final UsuarioRepositorio usuarioRepositorio;

    private final SucursalRepositorio sucursalRepositorio;

    // =========================
    // CREAR USUARIO
    // =========================

    @Override
    public UsuarioResponseDTO crear(UsuarioCrearDTO dto) {

        Sucursal sucursal = sucursalRepositorio.findById(dto.getSucursalId())
                .orElseThrow(() ->
                        new RuntimeException("No existe la sucursal")
                );

        RolEnum rol;
        
        try {
            rol = RolEnum.valueOf(dto.getRol());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Rol inválido");
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setUsername(dto.getUsername());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(rol);
        usuario.setSucursal(sucursal);

        usuarioRepositorio.save(usuario);

        return mapToResponse(usuario);
    }


    // =========================
    // LISTAR POR FABRICA
    // =========================
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarPorFabrica(Long fabricaId) {

        return usuarioRepositorio.findBySucursalFabricaId(fabricaId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // =========================
    // LISTAR POR SUCURSAL
    // =========================
    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponseDTO> listarPorSucursal(Long sucursalId) {

        return usuarioRepositorio.findBySucursalId(sucursalId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // =========================
    // OBTENER POR ID + FABRICA (BLINDADO)
    // =========================
    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO obtenerPorId(Long usuarioId, Long fabricaId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .filter(u ->
                        u.getSucursal()
                                .getFabrica()
                                .getId()
                                .equals(fabricaId)
                )
                .orElseThrow(() ->
                        new RuntimeException("El usuario no pertenece a esta fábrica")
                );

        return mapToResponse(usuario);
    }


    @Override
    public UsuarioResponseDTO editar(
            Long usuarioId,
            Long fabricaId,
            UsuarioEditarDTO dto) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .filter(u ->
                        u.getSucursal()
                                .getFabrica()
                                .getId()
                                .equals(fabricaId)
                )
                .orElseThrow(() ->
                        new RuntimeException("No puedes modificar este usuario")
                );

        // Actualizar solo los campos permitidos
        usuario.setNombre(dto.getNombre());
        usuario.setPassword(dto.getPassword()); // 🔐 luego se encripta

        return mapToResponse(usuario);
    }


    @Override
    public void eliminar(Long usuarioId, Long fabricaId) {

        Usuario usuario = usuarioRepositorio.findById(usuarioId)
                .filter(u ->
                        u.getSucursal()
                                .getFabrica()
                                .getId()
                                .equals(fabricaId)
                )
                .orElseThrow(() ->
                        new RuntimeException("No puedes eliminar este usuario")
                );

        usuarioRepositorio.delete(usuario);
    }


    // =========================
    // MAPPER A RESPONSE DTO
    // =========================
    private UsuarioResponseDTO mapToResponse(Usuario usuario) {

        UsuarioResponseDTO dto = new UsuarioResponseDTO();

        dto.setId(usuario.getId());
        dto.setNombre(usuario.getNombre());
        dto.setUsername(usuario.getUsername());

        // Rol desde enum
        dto.setRol(usuario.getRol().name());

        dto.setSucursalId(usuario.getSucursal().getId());
        dto.setNombreSucursal(usuario.getSucursal().getNombre());

        dto.setFabricaId(usuario.getSucursal().getFabrica().getId());
        dto.setNombreFabrica(usuario.getSucursal().getFabrica().getNombre());

        return dto;
    }


}
