/**
 * This file contains the ActionBar component for rendering action buttons in a blackjack game.
 * It provides buttons for player actions such as Hit, Stand, Double Down, and Split.
 */

/* Labels for the action buttons */
const actionLabels = ['Hit', 'Stand', 'Double Down', 'Split']

/* Descriptions for the action buttons */
const actionDescriptions = {
    Hit: 'Take another card to improve your hand while staying under 21.',
    Stand: 'Keep your current total and end your turn without drawing another card.',
    'Double Down':
        'Double your wager and take exactly one more card to maximize value.',
    Split:
        'Split matching cards into two separate hands and play each one independently.',
}

/**
 * ActionBar component that renders action buttons for the player.
 * @param param0
 * @param param0.onAction
 * @param param0.selectedAction
 * @param param0.disabled
 * @param param0.canSubmit
 * @param param0.startingPlayerHasBlackjack
 * @param param0.isSplitAvailable
 * @param param0.canDoubleDown
 * @param param0.playerHasTwentyOne
 * @returns {React.JSX.Element}
 * @constructor
 */
function ActionBar({
                       onAction,
                       selectedAction,
                       disabled,
                       canSubmit,
                       startingPlayerHasBlackjack,
                       isSplitAvailable,
                       canDoubleDown,
                       playerHasTwentyOne,
                   }) {
    return (
        <div className="action-strip">
            {actionLabels.map((label) => {
                const isSplit = label === 'Split'
                const isDoubleDown = label === 'Double Down'
                const isHit = label === 'Hit'

                const actionDisabled =
                    disabled ||
                    !canSubmit ||
                    (startingPlayerHasBlackjack && label !== 'Stand') ||
                    (isSplit && !isSplitAvailable) ||
                    (isDoubleDown && !canDoubleDown) ||
                    (isHit && playerHasTwentyOne)

                const isSelected =
                    selectedAction === label && !actionDisabled

                return (
                    <div key={label} className="action-button-wrap">
                        <button
                            type="button"
                            className={`action-button ${
                                label === 'Double Down'
                                    ? 'double'
                                    : label.toLowerCase()
                            } ${actionDisabled ? 'disabled' : ''} ${
                                isSelected ? 'selected' : ''
                            }`}
                            disabled={actionDisabled}
                            aria-pressed={isSelected}
                            onClick={() => {
                                console.log('ACTION CLICKED:', label)
                                console.log('actionDisabled:', actionDisabled)
                                console.log('canSubmit:', canSubmit)
                                console.log('disabled prop:', disabled)
                                onAction(label)
                            }}
                        >
                            <span>{label}</span>
                        </button>

                        <div
                            className="action-help"
                            tabIndex={0}
                            aria-label={`${label} help`}
                        >
                            ?
                            <span className="action-help-tooltip">
                {actionDescriptions[label]}
              </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default ActionBar