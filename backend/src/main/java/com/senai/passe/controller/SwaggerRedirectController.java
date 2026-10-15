package com.senai.passe.controller;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@Hidden
public class SwaggerRedirectController {

    @GetMapping("/api/v1/swagger-ui.html")
    public String redirectApiV1SwaggerUi() {
        return "redirect:/swagger-ui.html";
    }

    @GetMapping("/api/v1/swagger-ui")
    public String redirectApiV1SwaggerUiAlt() {
        return "redirect:/swagger-ui.html";
    }

    @GetMapping("/api/v1/v3/api-docs")
    public String forwardApiV1ApiDocs() {
        return "forward:/v3/api-docs";
    }
}
