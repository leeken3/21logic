package com.BlackJackStack.demo.model;

/**
 * Class representing a request for blackjack strategy advice.
 */
public class StrategyRequest {
    private String card1;
    private String card2;
    private String dealerCard;    
    
    /** 
     * Constructor for testing purposes.
     * @param card1 the first player card
     * @param card2 the second player card
     * @param dealerCard the dealer's up card
     */
    public StrategyRequest(String card1, String card2, String dealerCard) {
        this.card1 = card1;
        this.card2 = card2;
        this.dealerCard = dealerCard;
    }
    
    /**
     * Method to get the dealer makes hand percentage.
     * @return the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public String getCard1() {
        return card1;
    }
    
    /**
     * Method to set the dealer makes hand percentage.
     * @param dealerMakesHandPercentage the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public void setCard1(String card1) {
        this.card1 = card1;
    }
    
    /**
     * Method to get the dealer makes hand percentage.
     * @return the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public String getCard2() {
        return card2;
    }
    
    /**
     * Method to set the dealer makes hand percentage.
     * @param dealerMakesHandPercentage the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public void setCard2(String card2) {
        this.card2 = card2;
    }
    
    /**
     * Method to get the dealer makes hand percentage.
     * @return the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public String getDealerCard() {
        return dealerCard;
    }
    
    /**
     * Method to set the dealer makes hand percentage.
     * @param dealerMakesHandPercentage the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public void setDealerCard(String dealerCard) {
        this.dealerCard = dealerCard;
    }
    
}
