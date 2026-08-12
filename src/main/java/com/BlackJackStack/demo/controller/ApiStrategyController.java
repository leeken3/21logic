package com.BlackJackStack.demo.controller;

import java.util.LinkedHashMap;
import java.util.Map;

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
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class ApiStrategyController {

    @Autowired
    private StrategyService strategyService;

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

    public record RecommendationRequest(String card1, String card2, String dealer) {}
}
