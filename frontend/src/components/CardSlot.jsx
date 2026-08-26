/**
 * This file contains the CardSlot component for rendering individual cards in a blackjack game.
 * It displays the card's rank and suit, and can show the card face down if needed.
 */
import { getCardFace } from '../utils/blackjack'

/* Define the colors for each suit */
const suitColors = {
    '♥': '#d9305d',
    '♦': '#d9305d',
    '♣': '#111827',
    '♠': '#111827',
}

/**
 * CardSlot component that renders an individual card slot in a blackjack game.
 * @param param0
 * @param param0.value
 * @param param0.index
 * @param param0.hidden
 * @param param0.animate
 * @returns {React.JSX.Element}
 * @constructor
 */
function CardSlot({
                      value,
                      index = 0,
                      hidden = false,
                      animate = false,
                  }) {
    const card = hidden
        ? {
            rank: '',
            suit: '',
            hidden: true,
        }
        : getCardFace(value, index)

    /* Determine the color of the suit */
    const suitColor = suitColors[card.suit] || '#111827'

    /* Render the card slot with appropriate classes and styles */
    return (
        <div
            className={`card-slot ${animate ? 'card-deal' : ''}`}
            aria-label={
                card.hidden
                    ? 'Hidden card'
                    : `${card.rank}${card.suit}`
            }
        >
            <div
                className={`card-inner ${
                    card.hidden ? 'is-face-down' : ''
                } ${animate ? 'card-animate' : ''}`}
            >
                <div className="card-face card-front">
          <span
              className="card-rank top-left"
              style={{ color: suitColor }}
          >
            {card.rank}
          </span>

                    <span
                        className="card-suit center"
                        style={{ color: suitColor }}
                    >
            {card.suit}
          </span>

                    <span
                        className="card-rank bottom-right"
                        style={{ color: suitColor }}
                    >
            {card.rank}
          </span>
                </div>

                <div className="card-face card-back">
                    <div className="card-back-pattern" />
                </div>
            </div>
        </div>
    )
}

export default CardSlot