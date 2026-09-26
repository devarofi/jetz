import { Jetz, listOf, loop, stateOf } from '../../lib/jetz.js';
import { link } from '../../lib/jetz-router.js';
import {
    button, css, div, h1, hr, i, main, p, span
} from '../../lib/jetz-ui.js';

// ---------------------------------------------------------------------------
// Calculator Engine & Reactive State
// ---------------------------------------------------------------------------

export const display = stateOf('0');
export const formula = stateOf('');
export const historyList = listOf();

let currentInput = '0';
let previousOperand = null;
let currentOperator = null;
let awaitingNewNumber = false;
let lastEvaluated = false;

export function updateDisplay() {
    display.value = currentInput;
    if (previousOperand !== null && currentOperator !== null) {
        formula.value = `${previousOperand} ${currentOperator} ${awaitingNewNumber ? '' : currentInput}`;
    } else {
        formula.value = '';
    }
}

export function inputDigit(digit) {
    if (awaitingNewNumber || lastEvaluated) {
        currentInput = digit;
        awaitingNewNumber = false;
        lastEvaluated = false;
    } else {
        currentInput = currentInput === '0' ? digit : currentInput + digit;
    }
    updateDisplay();
}

export function inputDecimal() {
    if (awaitingNewNumber || lastEvaluated) {
        currentInput = '0.';
        awaitingNewNumber = false;
        lastEvaluated = false;
    } else if (!currentInput.includes('.')) {
        currentInput += '.';
    }
    updateDisplay();
}

export function calculate(a, b, op) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return 'Error';
    switch (op) {
        case '+': return String(numA + numB);
        case '-': return String(numA - numB);
        case '×':
        case 'x':
        case 'X':
        case '*': return String(numA * numB);
        case '÷':
        case '/':
            if (numB === 0) return 'Error';
            return String(numA / numB);
        default: return String(numB);
    }
}

export function handleOperator(nextOp) {
    if (currentInput === 'Error') {
        clearAll();
        return;
    }

    if (previousOperand === null) {
        previousOperand = currentInput;
    } else if (currentOperator && !awaitingNewNumber) {
        const result = calculate(previousOperand, currentInput, currentOperator);
        previousOperand = result;
        currentInput = result;
    }

    currentOperator = nextOp;
    awaitingNewNumber = true;
    lastEvaluated = false;
    updateDisplay();
}

export function evaluateEquals() {
    if (previousOperand === null || currentOperator === null || currentInput === 'Error') {
        return;
    }

    const expressionStr = `${previousOperand} ${currentOperator} ${currentInput}`;
    const result = calculate(previousOperand, currentInput, currentOperator);

    historyList.push({
        id: Date.now() + Math.random(),
        expr: expressionStr,
        result: result
    });

    currentInput = result;
    previousOperand = null;
    currentOperator = null;
    awaitingNewNumber = false;
    lastEvaluated = true;
    display.value = result;
    formula.value = `${expressionStr} =`;
}

export function clearAll() {
    currentInput = '0';
    previousOperand = null;
    currentOperator = null;
    awaitingNewNumber = false;
    lastEvaluated = false;
    display.value = '0';
    formula.value = '';
}

export function toggleSign() {
    if (currentInput === '0' || currentInput === 'Error') return;
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
    updateDisplay();
}

export function percentage() {
    if (currentInput === 'Error') return;
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = String(val / 100);
    updateDisplay();
}

export function clearHistory() {
    historyList.clear();
}


// ---------------------------------------------------------------------------
// UI Component
// ---------------------------------------------------------------------------

let stylesInjected = false;

export function Calculator() {
    if (!stylesInjected) {
        stylesInjected = true;
        Jetz.style(`
            #calculator-page {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .calc-btn-active:active {
                transform: scale(0.96);
            }
        `);
    }

    const btnBase = "h-14 font-semibold text-lg rounded-xl transition duration-150 flex items-center justify-center select-none calc-btn-active shadow-sm cursor-pointer";
    const numBtn = `${btnBase} bg-white text-gray-800 hover:bg-gray-100 border border-gray-200`;
    const fnBtn = `${btnBase} bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200`;
    const opBtn = `${btnBase} bg-indigo-600 text-white hover:bg-indigo-700 font-bold`;
    const eqBtn = `${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 font-bold`;

    return div({ id: 'calculator-page' },
        css`min-h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-gray-100 flex flex-col items-center justify-center p-4 sm:p-6`,

        // Top Navigation Bar
        div(
            css`w-full max-w-4xl flex items-center justify-between mb-6`,
            link('/',
                div(
                    css`flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition text-sm cursor-pointer backdrop-blur-sm`,
                    i(css`fa-solid fa-arrow-left`),
                    span('Home')
                )
            ),
            h1(
                css`text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-300 via-white to-purple-300 bg-clip-text text-transparent`,
                'Jetz Calculator'
            ),
            link('landing',
                div(
                    css`flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition text-sm cursor-pointer shadow-md shadow-indigo-500/20`,
                    i(css`fa-solid fa-store`),
                    span('Landing')
                )
            )
        ),

        // Main Container: Calculator + History Side-by-Side
        div(
            css`w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`,

            // Calculator Card
            div(
                css`lg:col-span-7 bg-white/95 backdrop-blur-md text-gray-900 rounded-3xl shadow-2xl p-6 border border-white/20`,

                // Screen Display
                div(
                    css`bg-slate-900 text-white rounded-2xl p-5 mb-5 shadow-inner flex flex-col justify-end min-h-[110px] text-right font-mono border border-slate-800`,
                    div(
                        { id: 'calc-formula' },
                        css`text-xs sm:text-sm text-indigo-400 min-h-[20px] tracking-wide truncate`,
                        formula
                    ),
                    div(
                        { id: 'calc-display' },
                        css`text-3xl sm:text-4xl font-bold tracking-tight text-white truncate mt-1`,
                        display
                    )
                ),

                // Button Grid (4x5)
                div(
                    css`grid grid-cols-4 gap-3`,
                    button({ id: 'btn-ac', onclick: clearAll }, css(fnBtn), 'AC'),
                    button({ id: 'btn-sign', onclick: toggleSign }, css(fnBtn), '±'),
                    button({ id: 'btn-pct', onclick: percentage }, css(fnBtn), '%'),
                    button({ id: 'btn-div', onclick: () => handleOperator('÷') }, css(opBtn), '÷'),

                    button({ id: 'btn-7', onclick: () => inputDigit('7') }, css(numBtn), '7'),
                    button({ id: 'btn-8', onclick: () => inputDigit('8') }, css(numBtn), '8'),
                    button({ id: 'btn-9', onclick: () => inputDigit('9') }, css(numBtn), '9'),
                    button({ id: 'btn-mul', onclick: () => handleOperator('×') }, css(opBtn), '×'),

                    button({ id: 'btn-4', onclick: () => inputDigit('4') }, css(numBtn), '4'),
                    button({ id: 'btn-5', onclick: () => inputDigit('5') }, css(numBtn), '5'),
                    button({ id: 'btn-6', onclick: () => inputDigit('6') }, css(numBtn), '6'),
                    button({ id: 'btn-sub', onclick: () => handleOperator('-') }, css(opBtn), '-'),

                    button({ id: 'btn-1', onclick: () => inputDigit('1') }, css(numBtn), '1'),
                    button({ id: 'btn-2', onclick: () => inputDigit('2') }, css(numBtn), '2'),
                    button({ id: 'btn-3', onclick: () => inputDigit('3') }, css(numBtn), '3'),
                    button({ id: 'btn-add', onclick: () => handleOperator('+') }, css(opBtn), '+'),

                    button({ id: 'btn-0', onclick: () => inputDigit('0') }, css(`${numBtn} col-span-2`), '0'),
                    button({ id: 'btn-dot', onclick: inputDecimal }, css(numBtn), '.'),
                    button({ id: 'btn-eq', onclick: evaluateEquals }, css(eqBtn), '=')
                )
            ),


            // History Panel
            div(
                css`lg:col-span-5 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 flex flex-col min-h-[380px] lg:h-[460px]`,
                div(
                    css`flex items-center justify-between pb-3 border-b border-white/10 mb-3`,
                    div(
                        css`flex items-center gap-2 text-white font-semibold text-lg`,
                        i(css`fa-solid fa-clock-rotate-left text-indigo-400`),
                        span('History')
                    ),
                    button(
                        { id: 'btn-clear-history', onclick: clearHistory },
                        css`text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-rose-500/80 text-white transition flex items-center gap-1.5 cursor-pointer`,
                        i(css`fa-solid fa-trash-can`),
                        span('Clear')
                    )
                ),

                // History List Container
                div(
                    { id: 'calc-history-list' },
                    css`flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar`,
                    loop(historyList, item => {
                        return div(
                            css`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition flex flex-col text-right cursor-pointer`,
                            {
                                onclick() {
                                    currentInput = item.result;
                                    display.value = item.result;
                                    formula.value = `${item.expr} =`;
                                }
                            },
                            span(css`text-xs text-gray-400 font-mono`, item.expr),
                            span(css`text-lg font-bold text-emerald-400 font-mono`, `= ${item.result}`)
                        );
                    })
                ),

                p(
                    css`text-xs text-gray-400 text-center mt-3 pt-3 border-t border-white/10`,
                    'Click any history item to recall its result.'
                )
            )
        )
    );
}

