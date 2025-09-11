package com.BlackJackStack.demo.controller;

import com.BlackJackStack.demo.model.StrategyRequest;
import com.BlackJackStack.demo.model.StrategyResponse;
import com.BlackJackStack.demo.service.StrategyService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
/**
 * Controller class to handle web requests for the BlackJackStack application.
 */
public class StrategyController {

    @Value("${spring.application.name:BlackJackStack}")
    private String appName;

    @Autowired
    private StrategyService strategyService;

    /**
     * Method to handle the root URL and display the index page.
     * @param model a Model to pass data to the view
     * @return the index view
     */
    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("appName", appName);
        return "index";  // refers to templates/index.html
    }

    // Handle form POST request
    @PostMapping("/recommend")
    /**
     * Method to handle strategy recommendation requests.
     * @param card1 a String representing the first player card
     * @param card2 a String representing the second player card
     * @param dealer a String representing the dealer's up card
     * @param model a Model to pass data to the view
     * @return the index view with strategy recommendation
     */
    public String recommendStrategy(@RequestParam String card1,
                                    @RequestParam String card2,
                                    @RequestParam String dealer,
                                    Model model) {

        StrategyRequest request = new StrategyRequest(card1, card2, dealer);
        request.setCard1(card1);
        request.setCard2(card2);
        request.setDealerCard(dealer);
        StrategyResponse response = strategyService.getStrategy(request);
        model.addAttribute("card1", card1.toUpperCase());
        model.addAttribute("card2", card2.toUpperCase());
        model.addAttribute("dealer", dealer.toUpperCase());
        model.addAttribute("move", response.getRecommendedMove());
        model.addAttribute("bustChance", String.format("%.1f%%", response.getBustPercentage() * 100));
        model.addAttribute("dealerBustChance", String.format("%.1f%%", response.getDealerBustPercentage() * 100));
        model.addAttribute("dealerMakesHandChance", String.format("%.1f%%", response.getDealerMakesHandPercentage() * 100));
        model.addAttribute("expectedValue", response.getExpectedValue());
        model.addAttribute("explanation", response.getExplanation());
        return "index";
    }
}
