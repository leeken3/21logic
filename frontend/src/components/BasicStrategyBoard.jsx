const dealerColumns = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A']

const hardRows = [
    ['17', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['16', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['15', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['14', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['13', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['12', 'H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['11', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
    ['10', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['9', 'H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['8', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
]

const softRows = [
    ['A,9', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['A,8', 'S', 'S', 'S', 'S', 'Ds', 'S', 'S', 'S', 'S', 'S'],
    ['A,7', 'Ds', 'Ds', 'Ds', 'Ds', 'Ds', 'S', 'S', 'H', 'H', 'H'],
    ['A,6', 'H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['A,5', 'H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['A,4', 'H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['A,3', 'H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['A,2', 'H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
]

const pairRows = [
    ['A,A', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['T,T', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['9,9', 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'Y', 'Y', 'N', 'N'],
    ['8,8', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y'],
    ['7,7', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N'],
    ['6,6', 'Y/N', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N', 'N'],
    ['5,5', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
    ['4,4', 'N', 'N', 'N', 'Y/N', 'Y/N', 'N', 'N', 'N', 'N', 'N'],
    ['3,3', 'Y/N', 'Y/N', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N'],
    ['2,2', 'Y/N', 'Y/N', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N'],
]

const surrenderRows = [
    ['16', '', '', '', '', '', '', '', 'SUR', 'SUR', 'SUR'],
    ['15', '', '', '', '', '', '', '', '', 'SUR', ''],
    ['14', '', '', '', '', '', '', '', '', '', ''],
]

function cellClass(value) {
    switch (value) {
        case 'H':
            return 'strategy-cell hit'
        case 'S':
            return 'strategy-cell stand'
        case 'D':
            return 'strategy-cell double'
        case 'Ds':
            return 'strategy-cell double-stand'
        case 'Y':
            return 'strategy-cell split'
        case 'Y/N':
            return 'strategy-cell split-conditional'
        case 'N':
            return 'strategy-cell no-split'
        case 'SUR':
            return 'strategy-cell surrender'
        default:
            return 'strategy-cell'
    }
}

function StrategyTable({ title, sideLabel, rows }) {
    return (
        <section className="strategy-section">
            <div className="strategy-side-label">
                {sideLabel.split('').map((letter, index) => (
                    <span key={`${letter}-${index}`}>{letter}</span>
                ))}
            </div>

            <div className="strategy-table-wrapper">
                <div className="strategy-title">{title}</div>

                <table className="strategy-table">
                    <thead>
                    <tr>
                        <th></th>
                        {dealerColumns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {rows.map((row) => (
                        <tr key={row[0]}>
                            <th>{row[0]}</th>

                            {row.slice(1).map((value, index) => (
                                <td
                                    key={`${row[0]}-${dealerColumns[index]}`}
                                    className={cellClass(value)}
                                >
                                    {value}
                                </td>
                            ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

function BasicStrategyBoard() {
    return (
        <div className="basic-strategy-board">
            <StrategyTable
                title="DEALER UPCARD"
                sideLabel="HARD TOTALS"
                rows={hardRows}
            />

            <StrategyTable
                title="DEALER UPCARD"
                sideLabel="SOFT TOTALS"
                rows={softRows}
            />

            <StrategyTable
                title="DEALER UPCARD"
                sideLabel="PAIR SPLITTING"
                rows={pairRows}
            />

            <section className="strategy-section surrender-section">
                <div className="strategy-side-label">
                    {'SURRENDER'.split('').map((letter, index) => (
                        <span key={`${letter}-${index}`}>{letter}</span>
                    ))}
                </div>

                <div className="strategy-table-wrapper">
                    <div className="strategy-title">DEALER UPCARD</div>

                    <table className="strategy-table">
                        <thead>
                        <tr>
                            <th></th>
                            {dealerColumns.map((column) => (
                                <th key={column}>{column}</th>
                            ))}
                        </tr>
                        </thead>

                        <tbody>
                        {surrenderRows.map((row) => (
                            <tr key={row[0]}>
                                <th>{row[0]}</th>

                                {row.slice(1).map((value, index) => (
                                    <td
                                        key={`${row[0]}-${dealerColumns[index]}`}
                                        className={cellClass(value)}
                                    >
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <div className="strategy-warning">
                INSURANCE OR EVEN MONEY: DON'T TAKE
            </div>

            <div className="strategy-key">
                <div className="key-title">KEY</div>

                <div className="key-row">
                    <span className="key-example hit">H</span>
                    <span>Hit</span>
                </div>

                <div className="key-row">
                    <span className="key-example stand">S</span>
                    <span>Stand</span>
                </div>

                <div className="key-row">
                    <span className="key-example double">D</span>
                    <span>Double if allowed, otherwise hit</span>
                </div>

                <div className="key-row">
                    <span className="key-example double-stand">Ds</span>
                    <span>Double if allowed, otherwise stand</span>
                </div>

                <div className="key-row">
                    <span className="key-example no-split">N</span>
                    <span>Don't split the pair</span>
                </div>

                <div className="key-row">
                    <span className="key-example split">Y</span>
                    <span>Split the Pair</span>
                </div>

                <div className="key-row">
                    <span className="key-example split-conditional">Y/N</span>
                    <span>Split only if `DAS` is offered</span>
                </div>

                <div className="key-row">
                    <span className="key-example surrender">SUR</span>
                    <span>Surrender</span>
                </div>
            </div>
        </div>
    )
}

export default BasicStrategyBoard