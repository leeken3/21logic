package com.BlackJackStack.demo.service;

import java.util.Random;
import org.springframework.stereotype.Service;
import com.BlackJackStack.demo.model.Hand;
import com.BlackJackStack.demo.model.Card;
import com.BlackJackStack.demo.model.StrategyRequest;
import com.BlackJackStack.demo.model.StrategyResponse;

/**
 * Service class that provides blackjack strategy recommendations and statistics.
 */
@Service
public class StrategyService {
    
    /** Number of simulations to run for statistical estimates, Monte Carlo*/
    private static final int SIMULATIONS = 10000;
    private final Random random;
    
    /** 
     * Default constructor to initialize the StrategyService with a Random instance.
     */
    public StrategyService() {
        this.random = new Random();
    }
    
    /** 
     * Constructor to initialize the StrategyService with a provided Random instance (for testing).
     * Injecting Random allows for deterministic testing cleanly.
     * @param random a Random instance to use for simulations
     */
    public StrategyService(Random random) {
        this.random = random;
    }

    /**
     * Method to get the recommended strategy and statistics based on the player's hand and dealer's up card.
     * @param request a StrategyRequest containing the player's cards and dealer's up card
     * @return a StrategyResponse containing the recommended move and statistics
     */
    public StrategyResponse getStrategy(StrategyRequest request) {
        Hand playerHand = new Hand();
        playerHand.addCard(new Card(request.getCard1()));
        playerHand.addCard(new Card(request.getCard2()));

        Card dealerCard = new Card(request.getDealerCard());

        StrategyResponse response = new StrategyResponse();

        // Get recommended move using real basic strategy
        String move = getBasicStrategyMove(playerHand, dealerCard);
        response.setRecommendedMove(move);

        // Example placeholder values for bust chance and EV
        response.setBustPercentage(estimatePlayerBustChance(playerHand));
        response.setDealerBustPercentage(estimateDealerBustChance(dealerCard));
        response.setExpectedValue(estimateExpectedValue(playerHand, dealerCard));
        response.setDealerMakesHandPercentage(estimateDealerMakesHandChance(dealerCard));
        response.setExplanation(explainMove(move, playerHand, playerHand.getValue(), playerHand.isSoft()));
        return response;
    }

    /**
     * Method to determine the basic strategy move based on player's hand and dealer's up card.
     * @param hand the player's Hand
     * @param dealerCard the dealer's up Card
     * @return the recommended move as a String ("hit", "stand", "double down", "split")
     */
    private String getBasicStrategyMove(Hand hand, Card dealerCard) {
        int playerTotal = hand.getValue();
        boolean isSoft = hand.isSoft();
        int dealerValue = dealerCard.getValue();
        if (dealerValue > 10) dealerValue = 10; // Face cards normalize to 10
        
        // Check for pairs first and handle splits
        if (hand.getCards().size() == 2 && hand.getCards().get(0).getRank().equals(hand.getCards().get(1).getRank())) {
            if (playerTotal == 20) 
                return "stand"; // Pair of 10s
            else if (playerTotal == 22) 
                return "split"; // Pair of Aces
            else if (playerTotal == 18)
                if (dealerValue == 7 || dealerValue == 10 || dealerValue == 11) // Ace
                    return "stand";
                else 
                    return "split"; // Pair of 9s
            else if (playerTotal == 16)
                return "split";
            else if (playerTotal == 14)
                if (dealerValue >= 2 && dealerValue <= 7)
                    return "split";
                else 
                    return "hit";
            else if (playerTotal == 12)
                if (dealerValue >= 2 && dealerValue <= 6)
                    return "split";
                else 
                    return "hit";
            else if (playerTotal == 10)
                if (dealerValue >= 2 && dealerValue <= 9)
                    return "double down";
                else 
                    return "hit";
            else if (playerTotal == 8)
                return "hit";
            else if (playerTotal == 4)
                if (dealerValue >= 4 && dealerValue <= 6)
                    return "split";
                else 
                    return "hit";
            else if (playerTotal == 6)
                if (dealerValue >= 4 && dealerValue <= 6)
                    return "split";
                else 
                    return "hit";
            return "split"; // Otherwise, split pairs
        }

        // Hard hands (first, non-soft hands)
        if (!isSoft) {
            if (playerTotal <= 8)
                return "hit";
            else if (playerTotal == 9) 
                return (dealerValue >= 3 && dealerValue <= 6) ? "double down" : "hit";
            else if (playerTotal == 10) 
                return (dealerValue <= 9) ? "double down" : "hit";
            else if (playerTotal == 11) 
                return "double down";
            else if (playerTotal == 12) 
                return (dealerValue >= 4 && dealerValue <= 6) ? "stand" : "hit";
            else if (playerTotal >= 13 && playerTotal <= 16) 
                return (dealerValue >= 2 && dealerValue <= 6) ? "stand" : "hit";
            return "stand"; // 17+
        }

        // Soft hands (contains an Ace counted as 11)
        if (isSoft) {
            if (playerTotal <= 17) 
                return (dealerValue >= 4 && dealerValue <= 6) ? "double down" : "hit";
            else if (playerTotal == 18) {
                if (dealerValue >= 9 || dealerValue == 10 || dealerValue == 11) // Ace
                    return "hit";
                else if (dealerValue >= 3 && dealerValue <= 6) // dealer 3–6
                    return "double down";
                else
                    return "stand";
            }
            return "stand"; // 19+
        }
        return "stand"; 
    }

    /**
     * Method to estimate the player's bust chance using Monte Carlo simulation.
     * @param playerHand the player's Hand
     * @return the estimated bust chance as a double (0.0 to 1.0)
     */
    private double estimatePlayerBustChance(Hand playerHand) {
        int busts = 0;
        for (int i = 0; i < SIMULATIONS; i++) {
            Hand copy = new Hand(playerHand);
            Card nextCard = drawRandomCard(); // Simulate drawing a random card
            copy.addCard(nextCard);
            if (copy.getValue() > 21) {
                busts++;
            }
        }
        return (double) busts / SIMULATIONS;
    }

    /** 
     * Method to estimate the dealer's bust chance using Monte Carlo simulation.
     * @param dealerCard the dealer's up Card
     * @return the estimated bust chance as a double (0.0 to 1.0)
     */
    private double estimateDealerBustChance(Card dealerCard) {
        int busts = 0;
        for (int i = 0; i < SIMULATIONS; i++) {
            Hand dealerHand = new Hand();
            dealerHand.addCard(dealerCard);
            // Simulate drawing cards until the dealer stands or busts
            while (dealerHand.getValue() < 17 || (dealerHand.getValue() == 17 && dealerHand.isSoft())) {
                dealerHand.addCard(drawRandomCard());
            }

            if (dealerHand.getValue() > 21) busts++;
        }
        return (double) busts / SIMULATIONS;
    }
    
    /**
     * Method to draw a random card (for simulation purposes).
     * @return a randomly drawn Card
     */
    public Card drawRandomCard() {
        String[] ranks = {"2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"};
        return new Card(ranks[random.nextInt(ranks.length)]);
    }

    /** 
     * Method to estimate the expected value of the player's hand against the dealer's up card using Monte Carlo simulation.
     * @param originalHand the player's original Hand
     * @param dealerCard the dealer's up Card
     * @return the estimated expected value as a double
     */
    private double estimateExpectedValue(Hand originalHand, Card dealerCard) {
        double totalEV = 0;
        for (int i = 0; i < SIMULATIONS; i++) {
            Hand player = new Hand(originalHand); // Clone
            Hand dealer = new Hand();
            dealer.addCard(dealerCard);
            dealer.addCard(drawRandomCard());

            double bet = 1.0;

            boolean playerBJ = player.isBlackjack();
            boolean dealerBJ = (dealer.getValue() == 21 && dealer.getCards().size() == 2);

            // Handle blackjacks
            if (playerBJ && !dealerBJ) {
                totalEV += 1.5 * bet;
                continue;
            } else if (playerBJ && dealerBJ) {
                totalEV += 0.0; // Push
                continue;
            }

            // Handle splits (assume no resplit, and 1 simulation per split hand)
            if (player.canSplit()) {
                String move = getBasicStrategyMove(player, dealerCard);
                if (move.equals("split")) {
                    Card newCard1 = drawRandomCard();
                    Card newCard2 = drawRandomCard();

                    Hand split1 = new Hand();
                    split1.addCard(player.getCards().get(0));
                    split1.addCard(newCard1);

                    Hand split2 = new Hand();
                    split2.addCard(player.getCards().get(1));
                    split2.addCard(newCard2);

                    totalEV += simulateHandEV(split1, dealerCard, bet);
                    totalEV += simulateHandEV(split2, dealerCard, bet);
                    continue;
                }
            }

            // Handle double down
            String firstMove = getBasicStrategyMove(player, dealerCard);
            if (firstMove.equals("double down")) {
                player.addCard(drawRandomCard());
                bet *= 2;
            } else {
                while (getBasicStrategyMove(player, dealerCard).equals("hit") && player.getValue() < 21) {
                    player.addCard(drawRandomCard());
                }
            }

            // Bust
            if (player.getValue() > 21) {
                totalEV -= bet;
                continue;
            }

            // Dealer plays
            while (dealer.getValue() < 17 || (dealer.getValue() == 17 && dealer.isSoft())) {
                dealer.addCard(drawRandomCard());
            }

            int playerVal = player.getValue();
            int dealerVal = dealer.getValue();

            if (dealerVal > 21) totalEV += bet;
            else if (playerVal > dealerVal) totalEV += bet;
            else if (playerVal < dealerVal) totalEV -= bet;
            else totalEV += 0.0;
        }
        return totalEV / SIMULATIONS;
    }
    
    /**
     * Method to simulate a single hand's expected value against the dealer's up card.
     * @param hand the player's Hand
     * @param dealerCard the dealer's up Card
     * @param bet the bet amount
     * @return the expected value of the hand as a double
     */
    private double simulateHandEV(Hand hand, Card dealerCard, double bet) {
        Hand player = new Hand(hand);
        Hand dealer = new Hand();
        dealer.addCard(dealerCard);
        dealer.addCard(drawRandomCard());

        // Simulate player moves
        while (getBasicStrategyMove(player, dealerCard).equals("hit") && player.getValue() < 21) {
            player.addCard(drawRandomCard());
        }

        if (player.getValue() > 21) return -bet;

        while (dealer.getValue() < 17 || (dealer.getValue() == 17 && dealer.isSoft())) {
            dealer.addCard(drawRandomCard());
        }

        int p = player.getValue(), d = dealer.getValue();
        if (d > 21) return bet;
        if (p > d) return bet;
        if (p < d) return -bet;
        return 0.0;
    }
    
    /**
     * Method to estimate the chance that the dealer makes a hand (17-21) using Monte Carlo simulation.
     * @param dealerCard the dealer's up Card
     * @return the estimated chance as a double (0.0 to 1.0)
     */
    private double estimateDealerMakesHandChance(Card dealerCard) {
        int makesHand = 0;

        for (int i = 0; i < SIMULATIONS; i++) {
            Hand dealer = new Hand();
            dealer.addCard(dealerCard);
            dealer.addCard(drawRandomCard());

            while (dealer.getValue() < 17 || (dealer.getValue() == 17 && dealer.isSoft())) {
                dealer.addCard(drawRandomCard());
            }

            int total = dealer.getValue();
            if (total >= 17 && total <= 21) {
                makesHand++;
            }
        }
        return (double) makesHand / SIMULATIONS;
    }
    
    /**
     * Method to provide an explanation for the recommended move.
     * @param move the recommended move as a String
     * @param playerTotal the player's total hand value
     * @param isSoft boolean indicating if the hand is soft
     * @return an explanation as a String
     */
    private String explainMove(String move, Hand playerHand, int playerTotal, boolean isSoft) {
        if ("hit".equals(move) && isSoft) {
            return "You have a soft hand (an Ace counted as 11). You should take another card to try to improve your hand without the risk of busting.";
        } else if ("double down".equals(move) && isSoft) {
            return "You have a soft hand (an Ace counted as 11). Doubling down allows you to take advantage of your flexible "
                    + "hand to potentially make a strong total with one more card. The dealer has a high chance of busting or making a weaker hand.";
        } else if (("stand".equals(move) && isSoft && (playerTotal == 19 || playerTotal == 20))) {
            return "You have a strong soft hand with an Ace counted as 11. You should keep your current hand and not take any more cards. "
                    + "You are unlikely to make your hand better by hitting. The dealer has a high chance of busting or making a weaker hand.";
        } else if ("hit".equals(move) && playerTotal <= 10) {
            return "You should take another card to try to improve your hand. You will not bust with one more card.";
        } else if ("hit".equals(move) && (playerTotal == 12 || playerTotal == 13)) {
            return "You should take another card to try to improve your hand as your bust probability is low and"
                    + "the dealer has over a 60% probability of making a hand. However, the expected value of hitting is negative.";
        } else if ("hit".equals(move) && playerTotal >= 13) {
            return "Even though your chance of busting is higher, you should take another card to "
                    + "try to improve your hand as the dealer has a very high probability of making a hand.";
        } else if ("stand".equals(move) && playerTotal == 21) {
            return "You have a Blackjack! You should keep your current hand and not take any more cards. "
                    + " You will win unless the dealer also has a Blackjack, which is a push.";
        } else if ("stand".equals(move) && playerTotal == 20 && !isSoft) {
            return "You should keep your current hand and not take any more cards. 20 is a very strong hand, "
                    + "and the dealer has a high chance of busting or making a weaker hand. Do not split 10s as it reduces your expected value.";
        } else if ("stand".equals(move)) {
            return "You should keep your current hand and not take any more cards. You are at risk of busting if you take another card."
                    + " The dealer may make their hand, but your expected value is higher by standing and not risking a bust.";
        } else if ("double down".equals(move) && playerTotal == 11) {
            return "You should always double down on 11. You have a high chance of making a strong hand with one more card, "
                    + "and the dealer has a high chance of busting or making a weaker hand.";
        } else if ("double down".equals(move) && playerTotal == 10) {
            return "You should double down on 10 unless the dealer has a 10 or Ace showing. "
                    + "You have a good chance of making a strong hand with one more card, "
                    + "and the dealer has a high chance of busting or making a weaker hand.";
        } else if ("double down".equals(move) && playerTotal == 9) {
            return "You should double down on 9 if the dealer has a 3, 4, 5, or 6 showing. "
                    + "You have a decent chance of making a strong hand with a max range of 19 or 20 with one more card, "
                    + "and the dealer has a high chance of busting or making a weaker hand.";
        } else if ("double down".equals(move)) {
            return "You should double your bet and take exactly one more card.";
        } else if ("split".equals(move) && playerHand.getCards().size() == 2 &&
                playerHand.getCards().get(0).getRank().equals("A") &&
                playerHand.getCards().get(1).getRank().equals("A")) {
           return "You have a pair of aces. Always split aces to maximize your chances of making a strong hand as you're likely"
                   + " to get a 10-value card on one or both hands. Each ace can then count as 11.";
        } else if ("split".equals(move) && playerTotal == 16) {
            return "Always split 8s. 16 is the worst hand in blackjack, and splitting gives you a chance to improve both hands.";
        } else if ("split".equals(move)){
            return "Splitting gives you a chance to improve both hands. Dealer has a chance of busting or making a weaker hand.";
        } else {
            return "No specific recommendation available.";
        }
    }
      
    }
