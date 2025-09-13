/* Blackjack Game Logic with Split and Double Down */
document.addEventListener("DOMContentLoaded", () => {
    const values = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
    let deck, playerHand, dealerHand;
	let playerHand1 = null, playerHand2 = null;
	let originalPlayerHand = null, originalDealerHand = null;
	let hasSplit = false;
	let currentHand = 1; // 1 or 2
	let bet = 10, bet1 = 10, bet2 = 10;

	/* Create and shuffle a new deck */
    function createDeck() {
        let d = [];
        for (let v of values) {
            // push just the value, no suit
            d.push({ value: v });
        }
        return d.sort(() => Math.random() - 0.5);
    }

	/* Calculate the value of a card */
    function cardValue(card) {
        if (["J","Q","K"].includes(card.value)) return 10;
        if (card.value === "A") return 11; // flexible, adjust later
        return parseInt(card.value);
    }

	/* Calculate the total value of a hand */
    function handValue(hand) {
        let total = hand.reduce((sum, c) => sum + cardValue(c), 0);
        let aces = hand.filter(c => c.value === "A").length;
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }

	/* Render hands to the UI */
	function renderHands() {
	    // Dealer hand
	    const dealerHandDiv = document.getElementById("dealerHand");
	    dealerHandDiv.innerHTML = "";
	    dealerHand.forEach(card => {
	        const span = document.createElement("span");
	        span.className = "playing-card dealer-card";
	        span.textContent = card.value;
	        dealerHandDiv.appendChild(span);
	    });
	    document.getElementById("dealerTotal").textContent = handValue(dealerHand);

	    // Player hands
	    if (playerHand1 && playerHand2) {
	        // Show both split hands
	        document.getElementById("playerHand1Area").style.display = "block";
	        document.getElementById("playerHand2Area").style.display = "block";
			document.getElementById("playerHandArea").style.display = "none";
	        renderPlayerHand(playerHand1, "playerHand1", "playerTotal1");
	        renderPlayerHand(playerHand2, "playerHand2", "playerTotal2");
	    } else {
	        // Show single hand
	        document.getElementById("playerHand1Area").style.display = "none";
	        document.getElementById("playerHand2Area").style.display = "none";
	        renderPlayerHand(playerHand, "playerHand", "playerTotal");
	    }
	}

	/* Render a specific player hand */
	function renderPlayerHand(hand, handDivId, totalSpanId) {
	    const handDiv = document.getElementById(handDivId);
	    handDiv.innerHTML = "";
	    hand.forEach(card => {
	        const span = document.createElement("span");
	        span.className = "playing-card player-card";
	        span.textContent = card.value;
	        handDiv.appendChild(span);
	    });
	    document.getElementById(totalSpanId).textContent = handValue(hand);
	}

	/* End the game with a message */
    function endGame(message) {
        document.getElementById("actions").style.display = "none";
        document.getElementById("result").innerHTML = `<h3>${message}</h3>`;
    }

	/* Check for blackjack */
	function isBlackjack(hand) {
	    return hand.length === 2 &&
	        ((hand[0].value === "A" && cardValue(hand[1]) === 10) ||
	         (hand[1].value === "A" && cardValue(hand[0]) === 10));
	}

	/* Dealer's turn logic */
	function dealerTurn() {
	    if (isBlackjack(playerHand)) {
	        // Dealer upcard is 10 or A
	        if (["10", "A"].includes(dealerHand[0].value)) {
	            // Dealer draws second card
	            dealerHand.push(deck.pop());
	            renderHands();
	            if (isBlackjack(dealerHand)) {
	                endGame("🤝 Push. Bet returned.");
	                return;
	            } else {
	                endGame(`✅ Blackjack! You win +$${(bet * 1.5).toFixed(2)}`);
	                return;
	            }
	        } else {
	            endGame(`✅ Blackjack! You win +$${(bet * 1.5).toFixed(2)}`);
	            return;
	        }
	    }
	    while (handValue(dealerHand) < 17) {
	        dealerHand.push(deck.pop());
	    }
	    renderHands();

	    let playerTotal = handValue(playerHand);
	    let dealerTotal = handValue(dealerHand);

	    if (dealerTotal > 21) {
			endGame(`✅ Dealer busts! You win +$${bet}`);
		} else if (playerTotal > dealerTotal) {
	        endGame(`✅ You win, you beat the dealer! +$${bet}`);
	    } else if (dealerTotal === playerTotal) {
	        endGame("🤝 Push. Bet returned.");
	    } else {
	        endGame(`❌ Dealer wins. -$${bet}`);
	    }
	}

	// Play button handler to start a new game
	document.getElementById("playBtn").addEventListener("click", () => {
	    const card1Value = document.getElementById("card1").value;
	    const card2Value = document.getElementById("card2").value;
	    const dealerValue = document.getElementById("dealer").value;

	    // Check if all inputs are filled
	    if (!card1Value || !card2Value || !dealerValue) {
	        alert("Please enter all three card values before playing.");
	        return;
	    }

	    hasSplit = false;
	    document.getElementById("initialCards").style.display = "none";
	    deck = createDeck(); // Always reset deck at the start of a round
	    if (originalPlayerHand && originalDealerHand) {
	        playerHand = [...originalPlayerHand];
	        dealerHand = [...originalDealerHand];
	        playerHand1 = null;
	        playerHand2 = null;
	        currentHand = 1;
	        bet1 = bet2 = bet;
	        originalPlayerHand = null;
	        originalDealerHand = null;

	        document.getElementById("playerHandArea").style.display = "block";
	        document.getElementById("playerHand1Area").style.display = "none";
	        document.getElementById("playerHand2Area").style.display = "none";

	        renderHands();
	        document.getElementById("gameArea").style.display = "block";
	        document.getElementById("actions").style.display = "block";
	        document.getElementById("result").innerHTML = "";
	    } else {
	        // Normal play logic
	        playerHand = [{ value: card1Value }, { value: card2Value }];
	        dealerHand = [{ value: dealerValue }];
	        bet = 10;
	        renderHands();
	        document.getElementById("gameArea").style.display = "block";
	        document.getElementById("actions").style.display = "block";
	        document.getElementById("result").innerHTML = "";
	    }
	});



	/* Hit button handler */
	document.getElementById("hitBtn").addEventListener("click", () => {
	    if (playerHand1 && playerHand2) {
	        let hand = currentHand === 1 ? playerHand1 : playerHand2;
	        hand.push(deck.pop());
	        renderHands();
	        if (handValue(hand) === 21) {
	            if (currentHand === 1) {
	                playerHand2.push(deck.pop());
	                currentHand = 2;
	                renderHands();
	            } else {
	                dealerTurnSplit();
	            }
	            return;
	        }
	        if (handValue(hand) > 21) {
	            if (currentHand === 1) {
	                playerHand2.push(deck.pop());
	                currentHand = 2;
	                renderHands();
	            } else {
	                dealerTurnSplit();
	            }
	        }
	    } else {
	        playerHand.push(deck.pop());
	        renderHands();
	        if (handValue(playerHand) === 21) {
	            dealerTurn();
	            return;
	        }
	        if (handValue(playerHand) > 21) {
	            endGame(`💥 Bust! You lose -$${bet}`);
	        }
	    }
	});

	/* Stand button handler */
	document.getElementById("standBtn").addEventListener("click", () => {
	    if (playerHand1 && playerHand2) {
	        if (currentHand === 1) {
	            // Move to hand 2, deal second card
	            playerHand2.push(deck.pop());
	            currentHand = 2;
	            renderHands();
	        } else {
	            dealerTurnSplit();
	        }
	    } else {
	        dealerTurn();
	    }
	});

	/* Double Down button handler */
	document.getElementById("doubleBtn").addEventListener("click", () => {
	    if (playerHand1 && playerHand2) {
	        if (currentHand === 1 && playerHand1.length === 2) {
	            bet1 *= 2;
	            playerHand1.push(deck.pop());
	            renderHands();
	            if (handValue(playerHand1) > 21) {
	                playerHand2.push(deck.pop());
	                currentHand = 2;
	                renderHands();
	            } else {
	                playerHand2.push(deck.pop());
	                currentHand = 2;
	                renderHands();
	            }
	        } else if (currentHand === 2 && playerHand2.length === 2) {
	            bet2 *= 2;
	            playerHand2.push(deck.pop());
	            renderHands();
	            dealerTurnSplit();
	        } else {
	            alert("You can only double down if you have 2 cards.");
	        }
	    } else if (playerHand.length === 2) {
	        bet *= 2;
	        playerHand.push(deck.pop());
	        renderHands();
	        if (handValue(playerHand) > 21) {
	            endGame(`💥 Bust after double! You lose -$${bet}`);
	        } else {
	            dealerTurn();
	        }
	    } else {
	        alert("You can only double down if you have 2 cards.");
	    }
	});

	/* Split button handler */
	document.getElementById("splitBtn").addEventListener("click", () => {
	    if (hasSplit) {
	        alert("This game only allows one split.");
	        return;
	    }
	    if (playerHand.length === 2 && playerHand[0].value === playerHand[1].value) {
	        hasSplit = true;
	        originalPlayerHand = [...playerHand];
	        originalDealerHand = [...dealerHand];

	        // Check for split aces
	        if (playerHand[0].value === "A") {
	            playerHand1 = [playerHand[0], deck.pop()];
	            playerHand2 = [playerHand[1], deck.pop()];
	            currentHand = 1;
	            renderHands();
	            document.getElementById("actions").style.display = "none"; // Hide actions, auto stand
	            dealerTurnSplit(); // Immediately resolve both hands
	        } else {
	            playerHand1 = [playerHand[0], deck.pop()];
	            playerHand2 = [playerHand[1]];
	            currentHand = 1;
	            renderHands();
	            document.getElementById("actions").style.display = "block";
	        }
	    } else {
	        alert("Split only allowed with 2 matching cards!");
	    }
	});
	
	/* Dealer turn logic for split hands */
	function dealerTurnSplit() {
	    while (handValue(dealerHand) < 17) {
	        dealerHand.push(deck.pop());
	    }
	    renderHands();
	    let results = [];
	    [playerHand1, playerHand2].forEach((hand, idx) => {
	        let playerTotal = handValue(hand);
	        let dealerTotal = handValue(dealerHand);
	        let betAmt = idx === 0 ? bet1 : bet2;
	        if (playerTotal > 21) {
	            results.push(`Hand ${idx+1}: 💥 Bust! You lose -$${betAmt}`);
	        } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
	            results.push(`Hand ${idx+1}: ✅ You win! +$${betAmt}`);
	        } else if (dealerTotal === playerTotal) {
	            results.push(`Hand ${idx+1}: 🤝 Push. Bet returned.`);
	        } else {
	            results.push(`Hand ${idx+1}: ❌ Dealer wins. -$${betAmt}`);
	        }
	    });
	    endGame(results.join("<br>"));
	}
	
	// Initial render
	document.getElementById("playerTotal").textContent = handValue(playerHand);
	document.getElementById("dealerTotal").textContent = handValue(dealerHand);
	
	/* Info icon toggle logic */
	document.addEventListener('DOMContentLoaded', function() {
	    const headerInfo = document.querySelector('.header-info');
	    const infoIcon = document.querySelector('.info-icon');

	    if (headerInfo && infoIcon) {
	        infoIcon.addEventListener('click', function(e) {
	            e.stopPropagation();
	            headerInfo.classList.toggle('active');
	        });

	        document.addEventListener('click', function() {
	            headerInfo.classList.remove('active');
	        });
	    }
	});
});

