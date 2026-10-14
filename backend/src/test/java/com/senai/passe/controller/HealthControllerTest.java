package com.senai.passe.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("Deve retornar 200 no health check com timestamp formatado no offset de Brasília")
    void deveRetornarHealthCheck() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.timestamp", matchesPattern("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}-03:00$")));
    }

    @Test
    @DisplayName("Deve retornar erro 400 padronizado estritamente no formato { message: '...' }")
    void deveRetornar400Padronizado() throws Exception {
        mockMvc.perform(get("/health/test-error/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Parâmetro de teste inválido.")))
                .andExpect(jsonPath("$.timestamp").doesNotExist())
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    @DisplayName("Deve retornar erro 404 padronizado estritamente no formato { message: '...' }")
    void deveRetornar404Padronizado() throws Exception {
        mockMvc.perform(get("/health/test-error/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", is("Recurso de teste não encontrado.")))
                .andExpect(jsonPath("$.timestamp").doesNotExist());
    }

    @Test
    @DisplayName("Deve retornar erro 409 padronizado estritamente no formato { message: '...' }")
    void deveRetornar409Padronizado() throws Exception {
        mockMvc.perform(get("/health/test-error/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Conflito de regra de negócio de teste.")))
                .andExpect(jsonPath("$.timestamp").doesNotExist());
    }
}
