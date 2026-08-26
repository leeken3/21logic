package com.BlackJackStack.demo.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.BlackJackStack.demo.model.StrategyRequest;
import com.BlackJackStack.demo.model.StrategyResponse;
import com.BlackJackStack.demo.service.StrategyService;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"})
/**
 * Controller for handling API requests related to blackjack strategy recommendations and explanations.
 */
public class ApiStrategyController {

    private static final List<String> CARD_RANKS = List.of("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");

    @Autowired
    private StrategyService strategyService;

    /**
     * Provides a recommendation for the next move based on the player's hand and the dealer's upcard.
     * @param request
     * @return
     */
    @PostMapping("/recommend")
    public Map<String, Object> recommend(@RequestBody RecommendationRequest request) {
        StrategyRequest strategyRequest = new StrategyRequest(
            request.card1(),
            request.card2(),
            request.dealer()
        );

        StrategyResponse response = strategyService.getStrategy(strategyRequest);

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("recommendedMove", response.getRecommendedMove());
        payload.put("bustPercentage", response.getBustPercentage());
        payload.put("dealerBustPercentage", response.getDealerBustPercentage());
        payload.put("dealerMakesHandPercentage", response.getDealerMakesHandPercentage());
        payload.put("expectedValue", response.getExpectedValue());
        payload.put("explanation", response.getExplanation());
        payload.put("card1", request.card1().toUpperCase());
        payload.put("card2", request.card2().toUpperCase());
        payload.put("dealer", request.dealer().toUpperCase());
        return payload;
    }

    /**
     * Generates an explanation for a given strategy decision.
     * @param request
     * @return
     */
    @PostMapping("/strategy-explanation")
    public Map<String, String> strategyExplanation(
            @RequestBody StrategyExplanationRequest request
    ) {
        String explanation = strategyService.generateStrategyBoardExplanation(
                request.decision(),
                request.hand(),
                request.dealer(),
                request.strategyType()
        );

        return Map.of("explanation", explanation);
    }

    /** Draws the rank used by the interactive table for a player hit. */
    @PostMapping("/draw")
    public Map<String, String> drawCard() {
        String rank = CARD_RANKS.get(ThreadLocalRandom.current().nextInt(CARD_RANKS.size()));
        return Map.of("rank", rank);
    }

    /**
     * Request body for the /recommend endpoint.
     * @param card1
     * @param card2
     * @param dealer
     */
    public record RecommendationRequest(String card1, String card2, String dealer) {}

    /**
     * Request body for the /strategy-explanation endpoint.
     * @param decision
     * @param hand
     * @param dealer
     * @param strategyType
     */
    public record StrategyExplanationRequest(
            String decision,
            String hand,
            String dealer,
            String strategyType
    ) {}
}
