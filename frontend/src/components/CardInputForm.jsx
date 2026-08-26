/**
 * This file contains the CardInputForm component for rendering a form to input player and dealer cards in a blackjack game.
 */

/**
 * CardInputForm component that renders a form for inputting player and dealer cards in a blackjack game.
 * @param param0
 * @param param0.formData
 * @param param0.inputWarning
 * @param param0.loading
 * @param param0.canSubmit
 * @param param0.onChange
 * @param param0.onSubmit
 * @returns {React.JSX.Element}
 * @constructor
 */
function CardInputForm({
                           formData,
                           inputWarning,
                           loading,
                           canSubmit,
                           onChange,
                           onSubmit,
                       }) {
    return (
        <form className="input-card" onSubmit={onSubmit}>
            <div className="field-grid">
                <label>
                    <span>Player Card 1</span>
                    <input
                        name="card1"
                        value={formData.card1}
                        onChange={onChange}
                        maxLength="2"
                    />
                </label>

                <label>
                    <span>Player Card 2</span>
                    <input
                        name="card2"
                        value={formData.card2}
                        onChange={onChange}
                        maxLength="2"
                    />
                </label>

                <label>
                    <span>Dealer Up Card</span>
                    <input
                        name="dealer"
                        value={formData.dealer}
                        onChange={onChange}
                        maxLength="2"
                    />
                </label>
            </div>

            {inputWarning && (
                <div className="input-warning">
                    {inputWarning}
                </div>
            )}

            <button
                type="submit"
                className="primary-button"
                disabled={loading || !canSubmit}
            >
                {loading ? 'Calculating…' : 'Get recommendation'}
            </button>
        </form>
    )
}

export default CardInputForm