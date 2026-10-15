package com.senai.passe.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Passe - Plataforma de Gestão de Mercado e Liga")
                        .version("1.0.0")
                        .description("API REST da plataforma Passe para gestão de mercado da bola, valuation de atletas com atributos técnicos, transferências contratuais, escalações táticas e simulação de partidas com duelos determinísticos. Projeto desenvolvido conforme regulamento do edital SENAI/PE (Cód. 237).")
                        .contact(new Contact()
                                .name("Equipe Desafio ISI DEV 1")
                                .url("https://github.com/jorgesoares2997/desafio-isi-dev-1"))
                        .license(new License().name("Apache 2.0").url("https://springdoc.org")))
                .tags(List.of(
                        new Tag().name("Jogadores").description("Gestão de ciclo de vida de atletas, atributos técnicos, condições físicas e listagem paginada"),
                        new Tag().name("Clubes").description("Gestão de clubes esportivos, finanças, elenco e ordenação posicional de atletas"),
                        new Tag().name("Mercado").description("Operações financeiras atômicas de compra, venda, taxas de transferência e extrato consolidado"),
                        new Tag().name("Liga & Partidas").description("Escalações táticas titulares, simulação oficial com 6 duelos (RN20) e classificação em tempo real (RN21)")
                ));
    }
}
