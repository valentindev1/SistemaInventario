package com.vhela.inventario.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.validation.FieldError;

import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> manejarRuntimeException(RuntimeException ex) {

        // Esto muestra el error en consola, pero como advertencia de negocio
        log.warn("Error de negocio: {}", ex.getMessage());

        List<String> errores = new ArrayList<>();
        errores.add(ex.getMessage());

        ErrorResponse response = new ErrorResponse(
                "Error",
                errores,
                LocalDateTime.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidaciones(MethodArgumentNotValidException ex) {

        List<String> errores = new ArrayList<>();

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errores.add(fieldError.getDefaultMessage());
        }

        // Esto muestra todas las validaciones fallidas en consola
        log.warn("Errores de validación: {}", errores);

        ErrorResponse response = new ErrorResponse(
                "Error de validación",
                errores,
                LocalDateTime.now()
        );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarErroresNoControlados(Exception ex) {

        // Esto sí imprime el stacktrace completo para errores graves
        log.error("Error interno no controlado", ex);

        List<String> errores = new ArrayList<>();
        errores.add("Ocurrió un error interno en el servidor");

        ErrorResponse response = new ErrorResponse(
                "Error interno",
                errores,
                LocalDateTime.now()
        );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }

    public record ErrorResponse(
            String titulo,
            List<String> errores,
            LocalDateTime fecha
    ) {}
}