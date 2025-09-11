package com.BlackJackStack.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import com.BlackJackStack.demo.model.Card;
import com.BlackJackStack.demo.model.StrategyRequest;
import com.BlackJackStack.demo.model.StrategyResponse;
import com.BlackJackStack.demo.service.StrategyService;
import static org.assertj.core.api.Assertions.*;
import java.util.Random;

@SpringBootTest
class StrategyServiceTest {

    /**
     * Test to ensure that drawing random cards is deterministic when using the same seed.
     * This helps verify that the random number generation is functioning as expected.
     */
	@Test
	void drawRandomCard_shouldBeDeterministicWithSeed() {
	    StrategyService strategyService1 = new StrategyService(new Random(42));
	    StrategyService strategyService2 = new StrategyService(new Random(42));
	    
	    Card card1a = strategyService1.drawRandomCard();
	    Card card2a = strategyService1.drawRandomCard();
	    
	    Card card1b = strategyService2.drawRandomCard();
	    Card card2b = strategyService2.drawRandomCard();
	    
	    assertThat(card1a.getRank()).isEqualTo(card1b.getRank());
	    assertThat(card2a.getRank()).isEqualTo(card2b.getRank());
	}
	
	/**
     * Test to ensure that drawing random cards produces different results with different seeds.
     * This helps verify that the random number generation is sensitive to the seed value.
     */
	@Test
	void drawRandomCard_shouldProduceDifferentCardsWithDifferentSeeds() {
        StrategyService strategyService1 = new StrategyService(new Random(42));
        StrategyService strategyService2 = new StrategyService(new Random(132));
        
        Card card1 = strategyService1.drawRandomCard();
        Card card2 = strategyService2.drawRandomCard();
        
        // There's a small chance they could be the same, but very unlikely
        assertThat(card1.getRank()).isNotEqualTo(card2.getRank());
    }
	
	/**
     * Test to ensure that drawing a random card returns a valid card object.
     * This helps verify that the card drawing functionality is working correctly.
     */
	@Test
	void drawRandomCard_shouldReturnValidCard() {
        StrategyService service = new StrategyService(new Random(42));
        Card card = service.drawRandomCard();
        assertThat(card).isNotNull();
        assertThat(card.getRank()).isIn("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A");
    }
	
	/**
     * Test to ensure that multiple draws of random cards return valid card objects.
     * This helps verify that the card drawing functionality is consistent and reliable.
     */
	@Test
	void drawRandomCard_multipleDrawsShouldBeValid() {
        StrategyService service = new StrategyService(new Random(42));
        for (int i = 0; i < 100; i++) {
            Card card = service.drawRandomCard();
            assertThat(card).isNotNull();
            assertThat(card.getRank()).isIn("2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A");
        }
    }
	
	/**
     * Test to verify that the strategy calculation returns valid probabilities and recommendations.
     * This ensures that the strategy service is functioning correctly and providing reasonable outputs.
     */
	@Test
	void calculateStrategy_shouldReturnValidProbabilities() {
	    StrategyService service = new StrategyService(new Random(42));
	    StrategyRequest req = new StrategyRequest("10", "6", "9");
	    StrategyResponse resp = service.getStrategy(req);
	    
	    assertThat(resp.getExpectedValue()).isBetween(-1.0, 1.0);
	    assertThat(resp.getBustPercentage()).isBetween(0.0, 1.0);
	    assertThat(resp.getRecommendedMove()).isIn("hit", "stand", "double", "split");
	    double sum = resp.getDealerBustPercentage() + resp.getDealerMakesHandPercentage();
	    assertThat(sum).isCloseTo(1.0, within(0.01));
	}
	
	/**
     * Test to ensure that using the same random seed produces consistent strategy results.
     * This helps verify that the strategy calculations are reproducible and reliable.
     */
	@Test
	void calculateStrategy_sameSeedShouldGiveSameResults() {
	    StrategyService service1 = new StrategyService(new Random(123));
	    StrategyService service2 = new StrategyService(new Random(123));
	    StrategyRequest req = new StrategyRequest("A", "10", "6");
	    StrategyResponse resp1 = service1.getStrategy(req);
	    StrategyResponse resp2 = service2.getStrategy(req);
	    assertThat(resp1.getExpectedValue()).isEqualTo(resp2.getExpectedValue());
	    assertThat(resp1.getBustPercentage()).isEqualTo(resp2.getBustPercentage());
	}
	
	/**
     * Test to ensure that using different random seeds produces different strategy results.
     * This helps verify that the strategy calculations are sensitive to the randomness introduced by different seeds.
     */
	@Test
	void calculateStrategy_differentSeedsShouldGiveDifferentResults() {
        StrategyService service1 = new StrategyService(new Random(123));
        StrategyService service2 = new StrategyService(new Random(456));
        StrategyRequest req = new StrategyRequest("5", "10", "6");
        StrategyResponse resp1 = service1.getStrategy(req);
        StrategyResponse resp2 = service2.getStrategy(req);
        // There's a small chance they could be the same, but very unlikely
        assertThat(resp1.getExpectedValue()).isNotEqualTo(resp2.getExpectedValue());
    }
	
	/**
     * Test to handle the edge case where the player has a blackjack (Ace and 10-value card).
     * This ensures that the strategy service correctly identifies and handles blackjack scenarios.
     */
	@Test
	void calculateStrategy_edgeCaseBlackjack() {
        StrategyService service = new StrategyService(new Random(42));
        StrategyRequest req = new StrategyRequest("A", "K", "5");
        StrategyResponse resp = service.getStrategy(req);
        
        assertThat(resp.getExpectedValue()).isGreaterThan(0.0);
        assertThat(resp.getRecommendedMove()).isEqualTo("stand");
    }
	
	/**
     * Test to handle the edge case where the player is on the verge of busting (e.g., 10 and 8 against dealer 9).
     * This ensures that the strategy service provides reasonable recommendations in high-risk scenarios.
     */
	@Test
	void calculateStrategy_edgeCaseBust() {
        StrategyService service = new StrategyService(new Random(42));
        StrategyRequest req = new StrategyRequest("10", "8", "9");
        StrategyResponse resp = service.getStrategy(req);
        
        assertThat(resp.getExpectedValue()).isLessThan(0.0);
        assertThat(resp.getRecommendedMove()).isIn("hit", "stand");
    }
	
	/**
     * Test to handle the edge case where the player has a pair of Aces.
     * This ensures that the strategy service correctly recommends splitting Aces.
     */
	@Test
	void calculateStrategy_edgeCasePairOfAces() {
        StrategyService service = new StrategyService(new Random(42));
        StrategyRequest req = new StrategyRequest("A", "A", "6");
        StrategyResponse resp = service.getStrategy(req);
        
        assertThat(resp.getExpectedValue()).isGreaterThan(0.0);
        assertThat(resp.getRecommendedMove()).isEqualTo("split");
    }
	
	/**
     * Test to handle the edge case where the player has a pair of eights.
     * This ensures that the strategy service correctly recommends splitting eights.
     */
	@Test
	void calculateStrategy_edgeCasePairOfEights() {
        StrategyService service = new StrategyService(new Random(42));
        StrategyRequest req = new StrategyRequest("8", "8", "10");
        StrategyResponse resp = service.getStrategy(req);
        
        assertThat(resp.getRecommendedMove()).isEqualTo("split");
    }

}
