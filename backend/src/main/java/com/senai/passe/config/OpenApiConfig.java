package com.senai.passe.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API Passe - SENAI/PE CÓD. 237")
                        .version("1.0.0")
                        .description("API REST para gestão do mercado da liga de futebol de 5 e partidas - Desafio ISI DEV 1.")
                        .contact(new Contact().name("Equipe de Desenvolvimento").email("dev@senaipe.org.br")));
    }
}
