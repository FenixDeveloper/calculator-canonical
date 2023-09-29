/*
* Функции обеспечивающие работу интерфейса калькулятора
* */

/**
 * Инициализирует дисплей калькулятора, возвращает объект с функциями для работы с ним.
 *
 * @param {HTMLElement} rootEl корневой DOM элемент калькулятора
 * @param {object} settings настройки
 * @param {object} settings.display объект настроек
 * @returns {object} API дисплея
 */
function initDisplay(rootEl, { display }) {
    const error = rootEl.querySelector(display.errorQuery);
    const equation = rootEl.querySelector(display.equationQuery);
    const result = rootEl.querySelector(display.resultQuery);

    /**
     * Установить или сбросить ошибку
     * @param {string} [value]
     * @returns {string}
     */
    const setError = value => error.textContent = value ?? "";

    /**
     * Установить или сбросить выражение
     * @param {string} [value]
     * @returns {string}
     */
    const setEquation = value => equation.textContent = value ?? "";

    /**
     * Включить признак выражения "рассчитано"
     * @param {boolean} isCalculated
     */
    const setEquationCalculated = isCalculated => isCalculated
        ? equation.classList.add(display.calculatedModifier)
        : equation.classList.remove(display.calculatedModifier);

    /**
     * Установить или сбросить результат и признак "рассчитано"
     * @param {string} [value]
     */
    const setResult = value => {
        result.textContent = value ?? "";
        setEquationCalculated(!!value);
    };

    /**
     * Сбросить состояние дисплея
     */
    const reset = () => {
        setError();
        setEquation();
        setResult();
    };

    return {
        setError,
        setEquation,
        setResult,
        reset
    };
}

/**
 * Инициализирует отдельную кнопку калькулятора
 *
 * @param {HTMLButtonElement} buttonEl
 * @param {function} onClick
 */
function initButton(buttonEl, onClick) {
    const value = buttonEl.textContent.trim();
    const type = buttonEl.dataset.type;

    buttonEl.addEventListener('click', (event) => {
        onClick({ event, type, value });
    });
}

/**
 * Инициализирует состояние ввода панели кнопок
 *
 * @param {object} settings настройки
 * @param {object} settings.errors тексты ошибок
 * @returns {object} API состояния
 */
function initState({ errors }) {
    /**
     * Форматирует текущее вводимое число из состояния.
     * @param {object} state
     * @returns {string}
     */
    const formatNum = (state) => {
        if (state.currentSign > 0) return state.currentNum;
        else return `(-${state.currentNum})`;
    }

    /**
     * Обрабатывает и валидирует посимвольный ввод с клавиатуры калькулятора
     *
     * @param {object} prevState предыдущее состояние
     * @param {object} action действие
     * @param {string} action.type тип кнопки
     * @param {string} action.value значение кнопки
     * @returns {object} следующее состояние
     *
     * @throws {string} текст ошибки при некорректном вводе
     */
    const input = (prevState, { type, value }) => {
        const state = Object.assign({}, prevState);

        /* Вспомогательные функции */

        const checkWait = (type, error) => {
            if (!state.waitFor.includes(type)) {
                throw error;
            }
        }
        const checkBrackets = (canOpen = true) => {
            if (state.bracketCount === 0) {
                state.waitFor = state.waitFor.filter(v => v !== 'close-bracket');
            } else {
                state.waitFor = [...state.waitFor, "close-bracket"];
            }
            if (canOpen) state.waitFor = [...state.waitFor, "open-bracket"];
        };
        const checkComma = () => {
            if (state.currentComma) {
                state.waitFor = ["num", "sign"];
            } else {
                state.waitFor = ["num", "sign", "comma"];
            }
        };
        const checkOperators = () => {
            if (state.currentNum) {
                state.waitFor = [...state.waitFor, "op"];
            } else {
                state.waitFor = state.waitFor.filter(v => v !== 'op');
            }
        };
        const parseNum = () => {
            if (state.currentNum) {
                state.stack.push(formatNum(state));
                state.currentNum = "";
                state.currentSign = 1;
                state.currentComma = false;
            }
        }

        /* Обработчики ввода */

        const inputNum = value => {
            checkWait('num', errors.waitForNumber);
            state.currentNum += value;
            checkComma();
            checkBrackets(false);
            checkOperators();
        };

        const inputSign = () => {
            checkWait('sign', errors.canNotChangeSign);
            state.currentSign *= (-1);
        };

        const inputComma = () => {
            checkWait('comma', errors.delimiterAlreadySet);
            state.currentNum += ".";
            state.currentComma = true;
            state.waitFor = ["num"];
            checkComma();
        };

        const inputOpenBracket = () => {
            checkWait('open-bracket', errors.canNotOpenBracket);
            parseNum();
            state.stack.push("(");
            state.bracketCount++;
            checkBrackets();
        };

        const inputCloseBracket = () => {
            checkWait('close-bracket', errors.canNotCloseBracket);
            parseNum();
            state.stack.push(")");
            state.bracketCount--;
            checkBrackets();
        };
        const inputOperand = value => {
            checkWait('op', errors.canNotSelectOperator);
            parseNum();
            state.stack.push(value);
            checkBrackets();
            checkOperators();
        };

        /* Роутинг действия по обработчикам */

        switch (type) {
            case "num":
                inputNum(value);
                break;
            case "mod":
                if (value === ",") inputComma();
                if (value === "±") inputSign();
                break;
            case "op":
                if (value === "(") inputOpenBracket();
                else if (value === ")") inputCloseBracket();
                else inputOperand(value);
                break;
            default:
                break;
        }

        return state;
    };

    /**
     * Вернуть актуальное выражение из состояния
     *
     * @param {object} state
     * @returns {string} выражение для вывода на дисплей
     */
    const getEquation = (state) => {
        return state.stack.join("") + formatNum(state);
    };

    /**
     * Вернуть выражение в постфиксной записи для вычисления.
     *
     * @param {object} state
     * @returns {string} выражение в постфиксной записи
     */
    const getPostfixEquation = (state) => {
        const items = [...state.stack];
        if (state.currentNum) {
            items.push(formatNum(state));
        }
        const infix = items
            .map(v => v.replace(/[\(\)]/g, ""))
            .join(" ");
        console.debug(`[calc] convert to infix: ${infix}`);
        return infixToPostfix(infix);
    };

    return {
        input,
        getEquation,
        reset: () => ({
            currentNum: "", // Текущее вводимое число
            currentSign: 1, // Знак текущего числа
            currentComma: false, // Дробное или нет число
            bracketCount: 0, // Уровень вложенности скобок
            waitFor: ["num", "open-bracket"], // Какие операции разрешены следующим вводом
            stack: [] // Уже введенные числа и операции
        }),
        getPostfixEquation
    };
}

/**
 * Инициализирует калькулятор
 *
 * @param {HTMLElement} rootEl корневой DOM элемент калькулятора
 * @param {object} settings настройки
 * @returns {object} API калькулятора
 */
function initCalculator(rootEl, settings) {
    const display = initDisplay(rootEl, settings);
    const buttons = rootEl.querySelectorAll(settings.buttonQuery);
    const state = initState(settings);
    let current = state.reset();

    buttons.forEach(button => {
        initButton(button, ({ type, value }) => {
            console.group(`input: ${value}`);
            console.debug(`[ui] button.onClick: ${type} => ${value}`);
            if (type === "act" && value === "C") {
                display.reset();
                current = state.reset();
                return;
            }

            if (type === "act" && value === "=") {
                if (current.stack.length === 0) return;

                if (current.bracketCount !== 0) {
                    display.setError('незакрыта скобка');
                    return;
                }
                const postfix = state.getPostfixEquation(current);
                console.debug(`[calc] convert to postfix: ${postfix}`);
                try {
                    const result = evaluatePostfix(postfix);
                    if (result % 1 > 0) {
                        display.setResult(result.toFixed(2));
                    } else {
                        display.setResult(result.toFixed(0));
                    }
                    current = state.reset();
                } catch (err) {
                    display.setError('некорректное выражение');
                }
                return;
            }

            try {
                if (current.stack.length === 0) {
                    display.setResult();
                }
                current = state.input(current, { type, value });
                console.debug(`[state] change`, current);
                display.setEquation(state.getEquation(current));
                display.setError();
            } catch (err) {
                display.setError(err);
            }
            console.groupEnd();
        });
    });

    return {
        ...display,
        input: state.input,
        // Вернуть актуальное состояние
        getState: () => current
    };
}