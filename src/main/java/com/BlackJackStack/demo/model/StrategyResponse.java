package com.BlackJackStack.demo.model;

/**
 * Class representing a response containing blackjack strategy advice.
 */
public class StrategyResponse {
    private String recommendedMove;
    private double bustPercentage;
    private double expectedValue;
    private String explanation;
    private double dealerBustPercentage;
    private double dealerMakesHandPercentage;
    
    /**
     * Method to get the recommended move.
     * @return the recommended move as a string (e.g., "HIT", "STAND", "DOUBLE", etc.)
     */
    public String getRecommendedMove() {
        return recommendedMove;
    }
    
    /**
     * Method to set the recommended move.
     * @param recommendedMove the recommended move as a string (e.g., "HIT", "STAND", "DOUBLE", etc.)
     */
    public void setRecommendedMove(String recommendedMove) {
        this.recommendedMove = recommendedMove;
    }
    
    /**
     * Method to get the bust percentage.
     * @return the bust percentage as a double (e.g., 0.23 for 23%)
     */
    public double getBustPercentage() {
        return bustPercentage;
    }
    
    /**
     * Method to get the dealer bust percentage.
     * @return the dealer bust percentage as a double (e.g., 0.28 for 28%)
     */
    public double getDealerBustPercentage() {
        return dealerBustPercentage;
    }
    
    /**
     * Method to set the dealer bust percentage.
     * @param dealerBustPercentage the dealer bust percentage as a double (e.g., 0.28 for 28%)
     */
    public void setDealerBustPercentage(double dealerBustPercentage) {
        this.dealerBustPercentage = dealerBustPercentage;
    }
    
    /**
     * Method to set the bust percentage.
     * @param bustPercentage the bust percentage as a double (e.g., 0.23 for 23%)
     */
    public void setBustPercentage(double bustPercentage) {
        this.bustPercentage = bustPercentage;
    }
    
    /**
     * Method to get the expected value of the recommended move.
     * @return the expected value as a double (e.g., -0.5 for a loss of half the bet)
     */
    public double getExpectedValue() {
        return expectedValue;
    }
    
    /**
     * Method to set the expected value of the recommended move.
     * @param expectedValue the expected value as a double (e.g., -0.5 for a loss of half the bet)
     */
    public void setExpectedValue(double expectedValue) {
        this.expectedValue = expectedValue;
    }
    
    /**
     * Method to get the explanation for the recommended move.
     * @return the explanation as a string
     */
    public String getExplanation() {
        return explanation;
    }
    
    /**
     * Method to set the explanation for the recommended move.
     * @param explanation the explanation as a string
     */
    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
    
    /**
     * Method to get the dealer makes hand percentage.
     * @return the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public double getDealerMakesHandPercentage() {
        return dealerMakesHandPercentage;
    }

    /**
     * Method to set the dealer makes hand percentage.
     * @param dealerMakesHandPercentage the dealer makes hand percentage as a double (e.g., 0.72 for 72%)
     */
    public void setDealerMakesHandPercentage(double dealerMakesHandPercentage) {
        this.dealerMakesHandPercentage = dealerMakesHandPercentage;
    }

}
