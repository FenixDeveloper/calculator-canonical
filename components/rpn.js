/*
* Функции для конвертации выражения и выполнения вычислений в калькуляторе.
* Операторы в функциях должны соответствовать операторам в интерфейсе.
* */

/**
 * Реализация алгоритма "сортировочной станции" Эдсгера Дейкстры.
 * Преобразует математическое выражение в инфиксной нотации в постфиксную.
 *
 * @param {string} infix разделенные пробелами числа и операторы
 * @returns {string}
 *
 * @example
 * input: "3 + 5 * ( 2 - 8 )"
 * output: "3 5 2 8 - * +"
 */
function infixToPostfix(infix) {
    const output = [];
    const operators = [];

    // Приоритет операторов
    const precedence = {
        '+': 1,
        '-': 1,
        '×': 2,
        '÷': 2,
        // '^': 3 // @todo: поддержка возведения в степень
    };

    // Делим токены через пробел и перебираем их последовательно
    for (let token of infix.split(/\s+/)) {
        // Поддерживаем работу с дробными числами
        if (parseFloat(token)) {
            output.push(token);
        } else if (token === '(') {
            operators.push(token);
        } else if (token === ')') {
            let topOperator = operators.pop();
            while (topOperator !== '(') {
                output.push(topOperator);
                topOperator = operators.pop();
            }
        } else {
            while (
                operators.length &&
                precedence[operators[operators.length - 1]] >= precedence[token]
            ) {
                output.push(operators.pop());
            }
            operators.push(token);
        }
    }

    while (operators.length) {
        output.push(operators.pop());
    }

    return output.join(' ');
}

/**
 * Вычисляет математическое выражение переданное в постфиксной записи обратной польской нотации.
 *
 * @param {string} postfix
 * @returns {number}
 * @throws Error
 */
function evaluatePostfix(postfix) {
    const stack = [];
    const operators = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '×': (a, b) => a * b,
        '÷': (a, b) => a / b,
        // '^': (a, b) => Math.pow(a, b) // @todo: поддержка возведения в степень
    };

    // Делим токены через пробел и перебираем их последовательно
    for (let token of postfix.split(/\s+/)) {
        // Поддерживаем работу с дробными числами
        if (parseFloat(token) || token === '0') {
            stack.push(parseFloat(token));
        } else if (operators[token]) {
            const b = stack.pop();
            const a = stack.pop();
            stack.push(operators[token](a, b));
        }
    }

    if (stack.length !== 1) {
        throw new Error('Invalid postfix expression');
    }

    return stack[0];
}