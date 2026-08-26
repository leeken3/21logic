/**
 * This file contains the RecommendationPanel component for displaying the recommended move and related statistics for a blackjack hand.
 */

/**
 * Component that displays the recommended move and related statistics for a blackjack hand.
 * @param param0
 * @param param0.result
 * @returns {React.JSX.Element}
 * @constructor
 */
function RecommendationPanel({ result }) {
    const moveLabel = result.recommendedMove?.toUpperCase() || ''

    const stats = [
        {
            label: 'Bust chance',
            description:
                'Chance that your current hand will bust if you take another card.',
            value:
                result.bustPercentage !== null
                    ? `${(result.bustPercentage * 100).toFixed(1)}%`
                    : '—',
        },
        {
            label: 'Dealer bust',
            description:
                'Probability the dealer goes over 21 after the deal is complete.',
            value:
                result.dealerBustPercentage !== null
                    ? `${(result.dealerBustPercentage * 100).toFixed(1)}%`
                    : '—',
        },
        {
            label: 'Dealer makes hand',
            description:
                'Likelihood the dealer finishes with a playable hand instead of busting.',
            value:
                result.dealerMakesHandPercentage !== null
                    ? `${(result.dealerMakesHandPercentage * 100).toFixed(1)}%`
                    : '—',
        },
        {
            label: 'Expected value',
            description:
                'Average profit or loss for this decision based on the current odds.',
            value:
                result.expectedValue !== null
                    ? Number(result.expectedValue).toFixed(2)
                    : '—',
        },
    ]

    return (
        <div className="result-panel">
            <div className="result-header">
                <div className="result-label-block">
                    <span className="result-kicker">Recommendation</span>
                    <span className="result-subtitle">Best play</span>
                </div>

                <div className="move-pill">
                    <strong>{moveLabel}</strong>
                </div>
            </div>

            <div className="stats-grid">
                {stats.map(({ label, description, value }) => (
                    <div
                        key={label}
                        className="stat-tile"
                        title={description}
                    >
                        <span>{label}</span>
                        <strong>{value}</strong>

                        <div className="stat-tooltip">
                            {description}
                        </div>
                    </div>
                ))}
            </div>

            <p className="explanation">
                {result.explanation}
            </p>
        </div>
    )
}

export default RecommendationPanel