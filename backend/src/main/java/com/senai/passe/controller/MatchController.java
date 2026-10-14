package com.senai.passe.controller;

import com.senai.passe.dto.MatchCreateRequest;
import com.senai.passe.dto.MatchDetailResponse;
import com.senai.passe.dto.MatchSummaryResponse;
import com.senai.passe.dto.StandingResponse;
import com.senai.passe.service.MatchService;
import com.senai.passe.util.ValidationUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@Tag(name = "Partidas e Liga", description = "Endpoints de simulação de partidas e tabela de classificação")
public class MatchController {

    private final MatchService matchService;

    public MatchController(MatchService matchService) {
        this.matchService = matchService;
    }

    @PostMapping({"/matches", "/api/v1/matches"})
    @Operation(summary = "Realiza uma partida determinística entre dois clubes com escalação completa")
    public ResponseEntity<MatchDetailResponse> createMatch(@RequestBody MatchCreateRequest req) {
        MatchDetailResponse resp = matchService.createMatch(req);
        URI location = URI.create("/api/v1/matches/" + resp.id());
        return ResponseEntity.created(location).body(resp);
    }

    @GetMapping({"/matches", "/api/v1/matches"})
    @Operation(summary = "Lista histórico de partidas com filtro opcional por clube")
    public ResponseEntity<List<MatchSummaryResponse>> listMatches(
            @RequestParam(name = "club_id", required = false) String clubId
    ) {
        List<MatchSummaryResponse> resp = matchService.listMatches(clubId);
        return ResponseEntity.ok(resp);
    }

    @GetMapping({"/matches/{id}", "/api/v1/matches/{id}"})
    @Operation(summary = "Consulta detalhes de uma partida com os 6 duelos determinísticos")
    public ResponseEntity<MatchDetailResponse> getMatch(@PathVariable("id") String idStr) {
        Long id = ValidationUtils.parsePositiveId(idStr);
        MatchDetailResponse resp = matchService.getMatch(id);
        return ResponseEntity.ok(resp);
    }

    @GetMapping({"/standings", "/api/v1/standings"})
    @Operation(summary = "Consulta tabela de classificação da liga calculada em tempo real")
    public ResponseEntity<List<StandingResponse>> getStandings() {
        List<StandingResponse> resp = matchService.getStandings();
        return ResponseEntity.ok(resp);
    }
}
