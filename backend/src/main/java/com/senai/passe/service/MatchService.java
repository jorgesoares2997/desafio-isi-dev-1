package com.senai.passe.service;

import com.senai.passe.dto.*;
import com.senai.passe.exception.BadRequestException;
import com.senai.passe.exception.BusinessRuleException;
import com.senai.passe.exception.ResourceNotFoundException;
import com.senai.passe.model.Clube;
import com.senai.passe.model.DueloPartida;
import com.senai.passe.model.Partida;
import com.senai.passe.repository.ClubeRepository;
import com.senai.passe.repository.DueloPartidaRepository;
import com.senai.passe.repository.PartidaRepository;
import com.senai.passe.service.dto.DueloResult;
import com.senai.passe.service.dto.PartidaSimulacaoResult;
import com.senai.passe.service.dto.TitularInfo;
import com.senai.passe.util.ValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchService {

    private final PartidaRepository partidaRepository;
    private final DueloPartidaRepository dueloPartidaRepository;
    private final ClubeRepository clubeRepository;
    private final LineupService lineupService;
    private final MatchSimulationService matchSimulationService;

    public MatchService(PartidaRepository partidaRepository,
                        DueloPartidaRepository dueloPartidaRepository,
                        ClubeRepository clubeRepository,
                        LineupService lineupService,
                        MatchSimulationService matchSimulationService) {
        this.partidaRepository = partidaRepository;
        this.dueloPartidaRepository = dueloPartidaRepository;
        this.clubeRepository = clubeRepository;
        this.lineupService = lineupService;
        this.matchSimulationService = matchSimulationService;
    }

    @Transactional
    public MatchDetailResponse createMatch(MatchCreateRequest req) {
        if (req == null) {
            throw new BadRequestException("Corpo da requisição ausente.");
        }

        if (req.homeClubId() == null || req.homeClubId() <= 0) {
            throw new BadRequestException("ID do clube mandante é obrigatório e deve ser positivo.");
        }

        if (req.awayClubId() == null || req.awayClubId() <= 0) {
            throw new BadRequestException("ID do clube visitante é obrigatório e deve ser positivo.");
        }

        if (req.homeClubId().equals(req.awayClubId())) {
            throw new BadRequestException("O clube mandante deve ser diferente do clube visitante.");
        }

        Clube mandante = clubeRepository.findById(req.homeClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube mandante não encontrado para o ID: " + req.homeClubId()));

        Clube visitante = clubeRepository.findById(req.awayClubId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube visitante não encontrado para o ID: " + req.awayClubId()));

        LineupResponse escalacaoMandante = lineupService.getLineup(mandante.getId());
        if (!escalacaoMandante.complete() || escalacaoMandante.players().size() != 5) {
            throw new BusinessRuleException("O clube mandante '" + mandante.getNome() + "' não possui escalação completa com 5 titulares.");
        }

        LineupResponse escalacaoVisitante = lineupService.getLineup(visitante.getId());
        if (!escalacaoVisitante.complete() || escalacaoVisitante.players().size() != 5) {
            throw new BusinessRuleException("O clube visitante '" + visitante.getNome() + "' não possui escalação completa com 5 titulares.");
        }

        List<TitularInfo> titularesMandante = escalacaoMandante.players().stream()
                .map(this::toTitularInfo)
                .collect(Collectors.toList());

        List<TitularInfo> titularesVisitante = escalacaoVisitante.players().stream()
                .map(this::toTitularInfo)
                .collect(Collectors.toList());

        PartidaSimulacaoResult simResult = matchSimulationService.simularPartida(
                mandante.getId(), titularesMandante,
                visitante.getId(), titularesVisitante
        );

        OffsetDateTime jogadaEm = OffsetDateTime.now();

        Partida partida = new Partida();
        partida.setMandanteId(mandante.getId());
        partida.setVisitanteId(visitante.getId());
        partida.setGolsMandante(simResult.golsMandante());
        partida.setGolsVisitante(simResult.golsVisitante());
        partida.setFormacaoMandante(escalacaoMandante.formation());
        partida.setFormacaoVisitante(escalacaoVisitante.formation());
        partida.setJogadaEm(jogadaEm);

        Partida salva = partidaRepository.save(partida);

        List<DuelResponse> duelsDto = new ArrayList<>(6);
        for (DueloResult d : simResult.duelos()) {
            DueloPartida dp = new DueloPartida();
            dp.setPartidaId(salva.getId());
            dp.setOrdem(d.ordem());
            dp.setClubeAtacanteId(d.clubeAtacanteId());
            dp.setAtacanteId(d.atacanteId());
            dp.setDefensorId(d.defensorId());
            dp.setNomeAtacante(d.nomeAtacante());
            dp.setNomeDefensor(d.nomeDefensor());
            dp.setPosicaoAtacante(d.posicaoAtacante());
            dp.setPosicaoDefensor(d.posicaoDefensor());
            dp.setCondicaoAtacante(d.condicaoAtacante());
            dp.setCondicaoDefensor(d.condicaoDefensor());
            dp.setAtributoAtaque(d.atributoAtaque());
            dp.setAtributoDefesa(d.atributoDefesa());
            dp.setValorAtaque(d.valorAtaque());
            dp.setValorDefesa(d.valorDefesa());
            dp.setGol(d.gol());
            dueloPartidaRepository.save(dp);

            duelsDto.add(new DuelResponse(
                    d.ordem(),
                    d.clubeAtacanteId(),
                    new DuelParticipantDto(d.atacanteId(), d.nomeAtacante(), d.posicaoAtacante(), d.condicaoAtacante(), d.atributoAtaque(), d.valorAtaque()),
                    new DuelParticipantDto(d.defensorId(), d.nomeDefensor(), d.posicaoDefensor(), d.condicaoDefensor(), d.atributoDefesa(), d.valorDefesa()),
                    d.gol()
            ));
        }

        return new MatchDetailResponse(
                salva.getId(),
                jogadaEm,
                new MatchClubInfo(mandante.getId(), mandante.getNome(), salva.getFormacaoMandante(), salva.getGolsMandante()),
                new MatchClubInfo(visitante.getId(), visitante.getNome(), salva.getFormacaoVisitante(), salva.getGolsVisitante()),
                simResult.resultado(),
                duelsDto
        );
    }

    @Transactional(readOnly = true)
    public MatchDetailResponse getMatch(Long id) {
        Partida partida = partidaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Partida não encontrada para o ID: " + id));

        Clube mandante = clubeRepository.findById(partida.getMandanteId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube mandante não encontrado: " + partida.getMandanteId()));
        Clube visitante = clubeRepository.findById(partida.getVisitanteId())
                .orElseThrow(() -> new ResourceNotFoundException("Clube visitante não encontrado: " + partida.getVisitanteId()));

        List<DueloPartida> duelos = dueloPartidaRepository.findByPartidaIdOrderByOrdemAsc(id);
        List<DuelResponse> duelsDto = duelos.stream()
                .map(d -> new DuelResponse(
                        d.getOrdem(),
                        d.getClubeAtacanteId(),
                        new DuelParticipantDto(d.getAtacanteId(), d.getNomeAtacante(), d.getPosicaoAtacante(), d.getCondicaoAtacante(), d.getAtributoAtaque(), d.getValorAtaque()),
                        new DuelParticipantDto(d.getDefensorId(), d.getNomeDefensor(), d.getPosicaoDefensor(), d.getCondicaoDefensor(), d.getAtributoDefesa(), d.getValorDefesa()),
                        d.getGol()
                ))
                .collect(Collectors.toList());

        String resultado = calcularResultado(partida.getGolsMandante(), partida.getGolsVisitante());

        return new MatchDetailResponse(
                partida.getId(),
                partida.getJogadaEm(),
                new MatchClubInfo(mandante.getId(), mandante.getNome(), partida.getFormacaoMandante(), partida.getGolsMandante()),
                new MatchClubInfo(visitante.getId(), visitante.getNome(), partida.getFormacaoVisitante(), partida.getGolsVisitante()),
                resultado,
                duelsDto
        );
    }

    @Transactional(readOnly = true)
    public List<MatchSummaryResponse> listMatches(String clubIdStr) {
        List<Partida> partidas;
        if (clubIdStr != null) {
            Long clubId = ValidationUtils.parsePositiveFilterId(clubIdStr, "club_id");
            if (!clubeRepository.existsById(clubId)) {
                throw new ResourceNotFoundException("Clube não encontrado para o ID: " + clubId);
            }
            partidas = partidaRepository.findByMandanteIdOrVisitanteIdOrderByJogadaEmDescIdDesc(clubId, clubId);
        } else {
            partidas = partidaRepository.findAllByOrderByJogadaEmDescIdDesc();
        }

        Map<Long, String> clubeNomes = clubeRepository.findAll().stream()
                .collect(Collectors.toMap(Clube::getId, Clube::getNome));

        return partidas.stream().map(p -> {
            String nomeMandante = clubeNomes.getOrDefault(p.getMandanteId(), "Clube " + p.getMandanteId());
            String nomeVisitante = clubeNomes.getOrDefault(p.getVisitanteId(), "Clube " + p.getVisitanteId());
            String resultado = calcularResultado(p.getGolsMandante(), p.getGolsVisitante());

            return new MatchSummaryResponse(
                    p.getId(),
                    p.getJogadaEm(),
                    new MatchClubInfo(p.getMandanteId(), nomeMandante, p.getFormacaoMandante(), p.getGolsMandante()),
                    new MatchClubInfo(p.getVisitanteId(), nomeVisitante, p.getFormacaoVisitante(), p.getGolsVisitante()),
                    resultado
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StandingResponse> getStandings() {
        List<Clube> clubes = clubeRepository.findAll();
        List<Partida> partidas = partidaRepository.findAll();

        Map<Long, ClubStats> statsMap = new HashMap<>();
        for (Clube c : clubes) {
            statsMap.put(c.getId(), new ClubStats(c.getId(), c.getNome()));
        }

        for (Partida p : partidas) {
            ClubStats home = statsMap.get(p.getMandanteId());
            ClubStats away = statsMap.get(p.getVisitanteId());

            if (home != null && away != null) {
                home.played++;
                away.played++;

                home.goalsFor += p.getGolsMandante();
                home.goalsAgainst += p.getGolsVisitante();

                away.goalsFor += p.getGolsVisitante();
                away.goalsAgainst += p.getGolsMandante();

                if (p.getGolsMandante() > p.getGolsVisitante()) {
                    home.wins++;
                    home.points += 3;
                    away.losses++;
                } else if (p.getGolsVisitante() > p.getGolsMandante()) {
                    away.wins++;
                    away.points += 3;
                    home.losses++;
                } else {
                    home.draws++;
                    home.points += 1;
                    away.draws++;
                    away.points += 1;
                }
            }
        }

        List<ClubStats> list = new ArrayList<>(statsMap.values());

        // Ordenação RN21:
        // 1. Mais pontos
        // 2. Maior saldo de gols (goalsFor - goalsAgainst)
        // 3. Mais gols marcados (goalsFor)
        // 4. Nome em ordem alfabética Unicode NFD
        list.sort(Comparator
                .comparingInt((ClubStats s) -> s.points).reversed()
                .thenComparing(Comparator.comparingInt((ClubStats s) -> (s.goalsFor - s.goalsAgainst)).reversed())
                .thenComparing(Comparator.comparingInt((ClubStats s) -> s.goalsFor).reversed())
                .thenComparing(s -> ValidationUtils.normalizeUnaccented(s.clubName.toLowerCase())));

        List<StandingResponse> standings = new ArrayList<>(list.size());
        for (int i = 0; i < list.size(); i++) {
            ClubStats s = list.get(i);
            int goalDiff = s.goalsFor - s.goalsAgainst;
            standings.add(new StandingResponse(
                    i + 1,
                    s.clubId,
                    s.clubName,
                    s.played,
                    s.wins,
                    s.draws,
                    s.losses,
                    s.goalsFor,
                    s.goalsAgainst,
                    goalDiff,
                    s.points
            ));
        }

        return standings;
    }

    private String calcularResultado(int golsMandante, int golsVisitante) {
        if (golsMandante > golsVisitante) return "MANDANTE";
        if (golsVisitante > golsMandante) return "VISITANTE";
        return "EMPATE";
    }

    private TitularInfo toTitularInfo(PlayerResponse p) {
        return new TitularInfo(
                p.id(),
                p.name(),
                p.position(),
                p.condition(),
                p.pace(),
                p.shooting(),
                p.passing(),
                p.dribbling(),
                p.defending(),
                p.physical()
        );
    }

    private static class ClubStats {
        final Long clubId;
        final String clubName;
        int played = 0;
        int wins = 0;
        int draws = 0;
        int losses = 0;
        int goalsFor = 0;
        int goalsAgainst = 0;
        int points = 0;

        ClubStats(Long clubId, String clubName) {
            this.clubId = clubId;
            this.clubName = clubName;
        }
    }
}
