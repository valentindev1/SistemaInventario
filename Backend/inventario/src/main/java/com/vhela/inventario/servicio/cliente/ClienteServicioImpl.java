package com.vhela.inventario.servicio.cliente;

import java.util.List;

import com.vhela.inventario.repositorio.venta.FacturaVentaRepositorio;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vhela.inventario.dto.cliente.ClienteCrearDTO;
import com.vhela.inventario.dto.cliente.ClienteEditarDTO;
import com.vhela.inventario.dto.cliente.ClienteObtenerDTO;
import com.vhela.inventario.modelo.cliente.Cliente;
import com.vhela.inventario.modelo.empresa.Empresa;
import com.vhela.inventario.modelo.usuario.RolEnum;
import com.vhela.inventario.modelo.usuario.Usuario;
import com.vhela.inventario.repositorio.ClienteRepositorio;
import com.vhela.inventario.repositorio.EmpresaRepositorio;
import com.vhela.inventario.repositorio.UsuarioRepositorio;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ClienteServicioImpl implements ClienteServicio {

    private final ClienteRepositorio clienteRepositorio;
    private final EmpresaRepositorio empresaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final FacturaVentaRepositorio facturaVentaRepositorio;

    // ======================================================
    // CREAR CLIENTE
    // Cualquier usuario puede crear clientes.
    // SUPER_ADMIN puede definir empresa.
    // ADMIN y EMPLEADO crean clientes en su propia empresa.
    // ======================================================
    @Override
    public ClienteObtenerDTO crear(Long usuarioId, ClienteCrearDTO dto) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Empresa empresa = determinarEmpresaDestino(usuario, dto.getEmpresaId());

        String numeroDocumentoNormalizado = normalizarTexto(dto.getNumeroDocumento());

        if (clienteRepositorio.existsByNumeroDocumentoAndEmpresaId(
                numeroDocumentoNormalizado,
                empresa.getId())) {

            throw new RuntimeException(
                    "Ya existe un cliente con ese número de documento en la empresa"
            );
        }

        Cliente cliente = new Cliente();

        cliente.setEmpresa(empresa);
        cliente.setNumeroDocumento(numeroDocumentoNormalizado);
        cliente.setNombre(normalizarTexto(dto.getNombre()));
        cliente.setCorreo(normalizarCorreo(dto.getCorreo()));
        cliente.setTelefono(normalizarOpcional(dto.getTelefono()));


        Cliente guardado = clienteRepositorio.save(cliente);

        return mapToDTO(guardado);
    }

    // ======================================================
    // LISTAR CLIENTES
    // Todos los usuarios pueden listar.
    // SUPER_ADMIN lista todos.
    // ADMIN y EMPLEADO listan solo los de su empresa.
    // ======================================================
    @Override
    @Transactional(readOnly = true)
    public List<ClienteObtenerDTO> listar(Long usuarioId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return clienteRepositorio.findAll()
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        validarUsuarioConEmpresa(usuario);

        if (usuario.getRol() == RolEnum.ADMIN ||
                usuario.getRol() == RolEnum.EMPLEADO) {

            return clienteRepositorio.findByEmpresaId(usuario.getEmpresa().getId())
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }

        throw new RuntimeException("Rol no permitido");
    }



    private boolean clienteTieneVentas(Long clienteId) {
        return facturaVentaRepositorio.existsByClienteId(clienteId);
    }





    // ======================================================
    // OBTENER CLIENTE POR ID
    // Todos pueden consultar, pero respetando empresa.
    // ======================================================
    @Override
    @Transactional(readOnly = true)
    public ClienteObtenerDTO obtenerPorId(Long usuarioId, Long clienteId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Cliente cliente = clienteRepositorio.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        validarAccesoAEmpresa(usuario, cliente.getEmpresa().getId());

        return mapToDTO(cliente);
    }

    // ======================================================
    // OBTENER CLIENTE POR DOCUMENTO / CÉDULA
    // SUPER_ADMIN puede buscar globalmente.
    // ADMIN y EMPLEADO buscan solo dentro de su empresa.
    // ======================================================
    @Override
    @Transactional(readOnly = true)
    public ClienteObtenerDTO obtenerPorDocumento(
            Long usuarioId,
            String numeroDocumento
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        String documentoNormalizado = normalizarTexto(numeroDocumento);

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {

            List<Cliente> clientes = clienteRepositorio
                    .findByNumeroDocumento(documentoNormalizado);

            if (clientes.isEmpty()) {
                throw new RuntimeException("Cliente no encontrado");
            }

            if (clientes.size() > 1) {
                throw new RuntimeException(
                        "Existen varios clientes con este documento en diferentes empresas"
                );
            }

            return mapToDTO(clientes.get(0));
        }

        validarUsuarioConEmpresa(usuario);

        Cliente cliente = clienteRepositorio
                .findByNumeroDocumentoAndEmpresaId(
                        documentoNormalizado,
                        usuario.getEmpresa().getId()
                )
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        return mapToDTO(cliente);
    }

    // ======================================================
    // EDITAR CLIENTE
    // Todos los usuarios pueden editar clientes,
    // pero solo dentro de su empresa.
    // La cédula NO se edita.
    // ======================================================
    @Override
    public ClienteObtenerDTO editar(
            Long usuarioId,
            Long clienteId,
            ClienteEditarDTO dto
    ) {

        Usuario usuario = obtenerUsuario(usuarioId);

        Cliente cliente = clienteRepositorio.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        validarAccesoAEmpresa(usuario, cliente.getEmpresa().getId());

        if (clienteTieneVentas(cliente.getId())) {
            throw new RuntimeException(
                    "No se puede editar este cliente porque tiene ventas o facturas vinculadas"
            );
        }

        cliente.setNombre(normalizarTexto(dto.getNombre()));
        cliente.setCorreo(normalizarCorreo(dto.getCorreo()));
        cliente.setTelefono(normalizarOpcional(dto.getTelefono()));

        Cliente actualizado = clienteRepositorio.save(cliente);

        return mapToDTO(actualizado);
    }

    // ======================================================
    // ELIMINAR CLIENTE
    // Solo SUPER_ADMIN y ADMIN pueden eliminar.
    // EMPLEADO no elimina.
    // ======================================================
    @Override
    public void eliminar(Long usuarioId, Long clienteId) {

        Usuario usuario = obtenerUsuario(usuarioId);

        validarPermisoEliminarCliente(usuario);

        Cliente cliente = clienteRepositorio.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        validarAccesoAEmpresa(usuario, cliente.getEmpresa().getId());

        if (clienteTieneVentas(cliente.getId())) {
            throw new RuntimeException(
                    "No se puede eliminar este cliente porque tiene ventas o facturas vinculadas"
            );
        }

        clienteRepositorio.delete(cliente);
    }

    // ======================================================
    // MÉTODOS PRIVADOS
    // ======================================================

    private Usuario obtenerUsuario(Long usuarioId) {
        return usuarioRepositorio.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    private Empresa determinarEmpresaDestino(
            Usuario usuario,
            Long empresaIdDTO
    ) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {

            if (empresaIdDTO == null) {
                throw new RuntimeException("El ID de la empresa es obligatorio");
            }

            return empresaRepositorio.findById(empresaIdDTO)
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        }

        if (usuario.getRol() == RolEnum.ADMIN ||
                usuario.getRol() == RolEnum.EMPLEADO) {

            validarUsuarioConEmpresa(usuario);

            return usuario.getEmpresa();
        }

        throw new RuntimeException("Rol no permitido");
    }

    private void validarAccesoAEmpresa(
            Usuario usuario,
            Long empresaId
    ) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN) {
            return;
        }

        validarUsuarioConEmpresa(usuario);

        if (!usuario.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("No puedes acceder a clientes de otra empresa");
        }
    }

    private void validarPermisoEliminarCliente(Usuario usuario) {

        if (usuario.getRol() == RolEnum.SUPER_ADMIN ||
                usuario.getRol() == RolEnum.ADMIN) {
            return;
        }

        throw new RuntimeException("No tiene permisos para eliminar clientes");
    }

    private void validarUsuarioConEmpresa(Usuario usuario) {

        if (usuario.getEmpresa() == null) {
            throw new RuntimeException("El usuario no tiene empresa asignada");
        }
    }

    private String normalizarTexto(String texto) {

        if (texto == null || texto.isBlank()) {
            throw new RuntimeException("El texto no puede estar vacío");
        }

        return texto.trim();
    }

    private String normalizarOpcional(String texto) {

        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }

    private String normalizarCorreo(String correo) {

        if (correo == null || correo.isBlank()) {
            return null;
        }

        return correo.trim().toLowerCase();
    }

    private ClienteObtenerDTO mapToDTO(Cliente cliente) {

        ClienteObtenerDTO dto = new ClienteObtenerDTO();

        dto.setId(cliente.getId());

        dto.setEmpresaId(cliente.getEmpresa().getId());
        dto.setEmpresaNombre(cliente.getEmpresa().getNombre());

        dto.setNumeroDocumento(cliente.getNumeroDocumento());
        dto.setNombre(cliente.getNombre());
        dto.setCorreo(cliente.getCorreo());
        dto.setTelefono(cliente.getTelefono());
        dto.setFechaCreacion(cliente.getFechaCreacion());

        boolean bloqueado = clienteTieneVentas(cliente.getId());

        dto.setPuedeModificar(!bloqueado);

        dto.setMotivoBloqueo(
                bloqueado
                        ? "Cliente bloqueado porque tiene ventas o facturas vinculadas"
                        : null
        );

        return dto;
    }
}