/**
 * This file contains the SplitHand component for displaying a player's split hand in a blackjack game.
 * It shows the cards in the hand, the bet amount, and the total score for that hand.
 */

import CardSlot from './CardSlot'
import { getDisplayedPlayerTotal } from '../utils/blackjack'

/**
 * SplitHand component that displays a player's split hand, including cards, bet, and total score
 * @param param0
 * @param param0.hand
 * @param param0.handIndex
 * @param param0.activeSplitIndex
 * @param param0.handComplete
 * @returns {React.JSX.Element}
 * @constructor
 */
function SplitHand({
                       hand,
                       handIndex,
                       activeSplitIndex,
                       handComplete,
                       lastDrawnCard,
                   }) {
    if (!hand) return null

    const isActive = activeSplitIndex === handIndex && !handComplete
    const total = hand.cards.length
        ? getDisplayedPlayerTotal(hand.cards)
        : ''

    const handLabel = handIndex === 1 ? 'Right' : 'Left'

    return (
        <div
            className={`split-hand ${isActive ? 'is-active' : ''} ${
                hand.complete ? 'is-complete' : ''
            }`}
        >
            <div className="split-hand-label">
                <span>{handLabel}</span>
                <span className="split-hand-bet">${hand.bet}</span>
            </div>

            <div className="board-cards split-hand-cards">
                {hand.cards.map((card, index) => (
                    <CardSlot
                        key={`split-${handIndex}-${index}`}
                        value={card}
                        index={handIndex * 4 + index + 2}
                        hidden={!card}
                        animate={
                            lastDrawnCard?.side === 'player' &&
                            lastDrawnCard?.handIndex === handIndex &&
                            index === hand.cards.length - 1
                        }
                    />
                ))}
            </div>

            <div
                className={`meta-score split-hand-score ${
                    String(total).includes('/') ? 'soft-total' : ''
                }`}
            >
                {total}
            </div>
        </div>
    )
}

export default SplitHand