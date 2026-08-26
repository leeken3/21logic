/**
 * This file contains the GameBoard component for rendering the main game board of a blackjack game.
 */

import CardSlot from './CardSlot'
import SplitHand from './SplitHand'

/**
 * GameBoard component that renders the main game board of a blackjack game, including dealer and player cards, totals, and split hands.
 * @param param0
 * @param param0.dealerCardsToRender
 * @param param0.dealerHidden
 * @param param0.dealerTotal
 * @param param0.flipDealer
 * @param param0.lastDrawnCard
 * @param param0.showSplitBoard
 * @param param0.playerCardsToRender
 * @param param0.playerTotal
 * @param param0.flipPlayer1
 * @param param0.flipPlayer2
 * @param param0.splitHands
 * @param param0.activeSplitIndex
 * @param param0.handComplete
 * @returns {React.JSX.Element}
 * @constructor
 */
function GameBoard({
                       dealerCardsToRender,
                       dealerHidden,
                       dealerTotal,
                       flipDealer,
                       lastDrawnCard,
                       showSplitBoard,
                       playerCardsToRender,
                       playerTotal,
                       flipPlayer1,
                       flipPlayer2,
                       splitHands,
                       activeSplitIndex,
                       handComplete,
                   }) {
    return (
        <div className="board-area">
            <div className="dealer-row">
                <div className="board-cards">
                    {dealerCardsToRender.map((card, index) => (
                        <CardSlot
                            key={`dealer-${index}`}
                            value={card}
                            index={index}
                            hidden={!card || (index === 1 && dealerHidden)}
                            animate={
                                flipDealer ||
                                (lastDrawnCard?.side === 'dealer' &&
                                    index === dealerCardsToRender.length - 1)
                            }
                        />
                    ))}
                </div>

                <div className="board-meta">
                    <div className="meta-score">
                        {dealerTotal !== null ? dealerTotal : ''}
                    </div>
                    <div className="meta-name">Dealer</div>
                </div>
            </div>

            <div className={`player-row ${showSplitBoard ? 'is-split' : ''}`}>
                {showSplitBoard ? (
                    <div className="split-board">
                        <SplitHand
                            hand={splitHands[0]}
                            handIndex={0}
                            activeSplitIndex={activeSplitIndex}
                            handComplete={handComplete}
                            lastDrawnCard={lastDrawnCard}
                        />

                        <div className="split-divider" aria-hidden="true" />

                        <SplitHand
                            hand={splitHands[1]}
                            handIndex={1}
                            activeSplitIndex={activeSplitIndex}
                            handComplete={handComplete}
                            lastDrawnCard={lastDrawnCard}
                        />
                    </div>
                ) : (
                    <>
                        <div className="board-cards">
                            {playerCardsToRender.map((card, index) => (
                                <CardSlot
                                    key={`player-${index}`}
                                    value={card}
                                    index={index + 2}
                                    hidden={!card}
                                    animate={
                                        (index === 0 && flipPlayer1) ||
                                        (index === 1 && flipPlayer2) ||
                                        (lastDrawnCard?.side === 'player' &&
                                            lastDrawnCard?.handIndex == null &&
                                            index === playerCardsToRender.length - 1)
                                    }
                                />
                            ))}
                        </div>

                        <div className="board-meta player-meta">
                            <div
                                className={`meta-score ${
                                    playerTotal?.includes('/')
                                        ? 'soft-total'
                                        : ''
                                }`}
                            >
                                {playerTotal || ''}
                            </div>

                            <div className="meta-name">Player</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default GameBoard