package com.senai.passe.controller;

import com.senai.passe.dto.MatchCreateRequest;
import com.senai.passe.dto.MatchDetailResponse;
import com.senai.passe.dto.MatchSummaryResponse;
import com.senai.passe.dto.StandingResponse;
import com.senai.passe.service.MatchService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@Tag(name = "Liga & Partidas", description = "Endpoints de simulação de partidas oficiais e classificação em tempo real")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping({"/matches", "/api/v1/matches"})
    @Operation(summary = "Realiza partida oficial", description = "Simula os 6 duelos táticos determinísticos (RN20) entre dois clubes com escalações completas de 5 titulares.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Partida realizada com sucesso (Location no cabeçalho)"),
            @ApiResponse(responseCode = "400", description = "IDs de clubes inválidos ou iguais"),
            @ApiResponse(responseCode = "404", description = "Clube não encontrado"),
            @ApiResponse(responseCode = "409", description = "Um ou ambos os clubes possuem escalação incompleta")
    })
    public ResponseEntity<MatchDetailResponse> createMatch(@RequestBody MatchCreateRequest req) {
        MatchDetailResponse resp = matchService.createMatch(req);
        URI location = URI.create("/api/v1/matches/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping({"/matches", "/api/v1/matches"})
    @Operation(summary = "Lista histórico de partidas", description = "Retorna sumário das partidas disputadas com filtro opcional por ID do clube.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Histórico de partidas retornado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Filtro inválido")
    })
    public ResponseEntity<List<MatchSummaryResponse>> listMatches(
            @Parameter(description = "Filtro opcional por ID do clube")
            @RequestParam(name = "club_id", required = false) String clubId
    ) {
        List<MatchSummaryResponse> resp = matchService.listMatches(clubId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping({"/matches/{id}", "/api/v1/matches/{id}"})
    @Operation(summary = "Consulta detalhes de partida", description = "Retorna detalhes completos do confronto com a resolução dos 6 duelos posicionalmente ponderados.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Detalhes da partida encontrados"),
            @ApiResponse(responseCode = "404", description = "Partida não encontrada")
    })
    public ResponseEntity<MatchDetailResponse> getMatch(@Parameter(description = "ID da partida") @PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        MatchDetailResponse resp = matchService.getMatch(id);
        return ResponseEntity.ok(resp);
    }

    @GetMapping({"/standings", "/api/v1/standings"})
    @Operation(summary = "Tabela de classificação da liga", description = "Calcula a tabela dinâmica com todos os clubes cadastrados, ordenada por pontos (V=3, E=1, D=0), saldo de gols, gols pró e desempate alfabético NFD (RN21).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tabela de classificação calculada com sucesso")
    })
    public ResponseEntity<List<StandingResponse>> getStandings() {
        List<StandingResponse> resp = matchService.getStandings();
        return ResponseEntity.ok(resp);
    }
}
