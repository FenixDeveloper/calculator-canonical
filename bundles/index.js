const settings = {
    calculatorQuery: '#calculator-example',
    buttonQuery: '.button',
    display: {
        errorQuery: '.display__error',
        equationQuery: '.display__equation',
        resultQuery: '.display__result',
        calculatedModifier: 'display_calculated'
    },
    errors: {
        waitForNumber: 'ожидается число',
        canNotChangeSign: 'нельзя поменять знак',
        delimiterAlreadySet: 'разделитель уже установлен',
        canNotOpenBracket: 'сейчас нельзя открыть скобку',
        canNotCloseBracket: 'сейчас нельзя закрыть скобку',
        canNotSelectOperator: 'сейчас нельзя ввести оператор'
    }
};

const calculatorRootElement = document.querySelector(settings.calculatorQuery);

/**
 * Инициализированный калькулятор
 *
 * @type {object} API калькулятора
 */
const calculator = initCalculator(
    calculatorRootElement,
    settings
);