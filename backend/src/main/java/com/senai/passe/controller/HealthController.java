package com.senai.passe.controller;

import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Endpoints de verificação de integridade da API")
public class HealthController {

    @GetMapping
    @Operation(summary = "Verifica integridade da API")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "timestamp", OffsetDateTime.now()
        ));
    }

    @GetMapping("/test-date")
    @Operation(summary = "Verifica serialização de data com offset de Brasília (-03:00)")
    public ResponseEntity<Map<String, Object>> testDate() {
        return ResponseEntity.ok(Map.of(
                "servidor_horario_brasilia", OffsetDateTime.now()
        ));
    }

    @GetMapping("/test-error/{type}")
    @Operation(summary = "Testa formatação de erros padronizados (400, 404, 409)")
    public ResponseEntity<Void> testError(@PathVariable String type) {
        switch (type.toLowerCase()) {
            case "bad-request":
                throw new BadRequestException("Parâmetro de teste inválido.");
            case "not-found":
                throw new ResourceNotFoundException("Recurso de teste não encontrado.");
            case "conflict":
                throw new BusinessRuleException("Conflito de regra de negócio de teste.");
            default:
                throw new BadRequestException("Tipo de erro não suportado no teste: " + type);
        }
    }
}
