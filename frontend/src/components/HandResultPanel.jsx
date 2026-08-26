/**
 * This component displays the result of a hand in a poker game. It shows a message about the hand and provides buttons to replay the hand or refresh the game if the hand is complete.
 */

/**
 * HandResultPanel component that displays the result of a hand in a blackjack game.
 * @param param0
 * @param param0.handMessage
 * @param param0.handComplete
 * @param param0.onReplay
 * @param param0.onRefresh
 * @returns {React.JSX.Element|null}
 * @constructor
 */
function HandResultPanel({
                             handMessage,
                             handComplete,
                             onReplay,
                             onRefresh,
                         }) {
    if (!handMessage) return null

    return (
        <div className={`hand-result-panel ${handComplete ? 'with-actions' : ''}`}>
            <p>{handMessage}</p>

            {handComplete && (
                <div className="hand-result-actions">
                    <button
                        type="button"
                        className="hand-control-button"
                        onClick={onReplay}
                    >
                        Replay Hand
                    </button>

                    <button
                        type="button"
                        className="hand-control-button"
                        onClick={onRefresh}
                    >
                        Refresh
                    </button>
                </div>
            )}
        </div>
    )
}

export default HandResultPanel