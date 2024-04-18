var TokenTypes = {
    Identifier: "Identifier",
    Number: "Number",
    Plus: "Plus",
    Minus: "Minus",
    Multiply: "Multiply",
    Divide: "Divide",
    Modulus: "Modulus",
    Same: "Same",
    Equal: "Equal",
    And: "And",
    Smaller: "Smaller",
    Bigger: "Bigger",
    FunctionCall: "FunctionCall",
    EndOfLine: "EndOfLine",
    EndOfCode: "EndOfCode",
    String: "String",
    CodeBlock: "CodeBlock",
    Condition: "Condition",
    Comma: "Comma",
    Params: "Params",
    RoundBrackets: "RoundBrackets",
    SquareBrackets: "SquareBrackets",
    LogAnd: "LogAnd",
    LogOr: "LogOr"
};
class Token {
    constructor(t, v, name, l, p) {
        this.type = t;
        this.value = v;
        this.name = name;
        this.line = l;
        this.pos = p;
    }
}
function lex(c, l = 0, p = 0) {
    var line = l;
    var pos = p;
    var indentifierStartLetters = [
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
    ];
    var indentifierLetters = [
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
        ".", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "[", "]"
    ];
    var startNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
    var numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "e", "."];
    var operators = ["+", "-", "*", "/", "%", "=", "&", "<", ">", "|"];
    var tokens = [];
    function ink() {
        i++;
        pos++;
    }
    function processIdentifier() {
        var identifier = "";
        for (var j = i; j < c.length; j++) {
            if (!indentifierLetters.includes(c[j])) {
                break;
            }
            identifier += c[j];
            ink();
        }
        addToken(new Token(TokenTypes.Identifier, identifier, "", line, pos));
    }
    function processNumber() {
        var number = "";
        for (var j = i; j < c.length; j++) {
            if (!numbers.includes(c[j])) {
                break;
            }
            number += c[j];
            ink();
        }
        addToken(new Token(TokenTypes.Number, number, line, pos));
    }
    function processOperator() {
        switch(c[i]) {
            case "+":
                addToken(new Token(TokenTypes.Plus, "+", "", line, pos));
                ink();
                return;
            case "-":
                addToken(new Token(TokenTypes.Minus, "-", "", line, pos));
                ink();
                return;
            case "*":
                addToken(new Token(TokenTypes.Multiply, "*", "", line, pos));
                ink();
                return;
            case "/":
                addToken(new Token(TokenTypes.Divide, "/", "", line, pos));
                ink();
                return;
            case "%":
                addToken(new Token(TokenTypes.Modulus, "%", "", line, pos));
                ink();
                return;
            case "=":
                if (c[i+1] == "=") {
                    addToken(new Token(TokenTypes.Same, "==", "", line, pos));
                    ink();
                    ink();
                    return;
                }
                addToken(new Token(TokenTypes.Equal, "=", "", line, pos));
                ink();
                return;
            case "&":
                if (c[i+1] == "&") {
                    addToken(new Token(TokenTypes.LogAnd, "&&", "", line, pos));
                    ink();
                    ink();
                    return;
                }
                addToken(new Token(TokenTypes.And, "&", "", line, pos));
                ink();
                return;
            case "|":
                if (c[i+1] == "|") {
                    addToken(new Token(TokenTypes.LogOr, "||", "", line, pos));
                    ink();
                    ink();
                    return;
                }
                ink();
                return;
            case "<":
                addToken(new Token(TokenTypes.Smaller, "<", "", line, pos));
                ink();
                return;
            case ">":
                addToken(new Token(TokenTypes.Bigger, ">", "", line, pos));
                ink();
                return;
        }
        console.error("NLexer: Unknown Token: " + c[i]);
    }
    function processBrackets() {
        var code = "";
        var ind = 0;
        for (var j = i; j < c.length; j++) {
            var can = true;
            if (c[j] == "{") {
                ind++;
                if (ind == 1) {
                    can = false;
                }
            }
            if (c[j] == "}") {
                ind--;
                if (ind == 0) {
                    can = false;
                    ink();
                    break;
                }
            }
            if (can) {
                code += c[j];
            }
            if (c[j] == undefined) {
                break;
            }
            ink();
        }
        if (ind == 0) {
            addToken(new Token(TokenTypes.CodeBlock, lex(code, line, pos), "", line, pos));
        }
    }
    function processRoundBrackets() {
        var code = "";
        var ind = 0;
        var can = true;
        for (var j = i; j < c.length; j++) {
            var can = true;
            if (c[j] == "(") {
                ind++;
                if (ind == 1) {
                    can = false;
                }
            }
            if (c[j] == ")") {
                ind--;
                if (ind == 0) {
                    can = false;
                    ink();
                    break;
                }
            }
            if (can) {
                code += c[j];
            }
            ink();
        }
        if (ind == 0) {
            addToken(new Token(TokenTypes.RoundBrackets, lex(code, line, pos), "", line, pos));
        }
    }
    function processSquareBrackets() {
        var code = "";
        var ind = 0;
        var can = true;
        for (var j = i; j < c.length; j++) {
            var can = true;
            if (c[j] == "[") {
                ind++;
                if (ind == 1) {
                    can = false;
                }
            }
            if (c[j] == "]") {
                ind--;
                if (ind == 0) {
                    can = false;
                    ink();
                    break;
                }
            }
            if (can) {
                code += c[j];
            }
            ink();
        }
        if (ind == 0) {
            addToken(new Token(TokenTypes.SquareBrackets, lex(code, line, pos), "", line, pos));
        }
    }
    function processString() {
        ink();
        var string = "";
        for (var j = i; j < c.length; j++) {
            if (c[j] == '"' && c[j-1] !== "\\") {
                addToken(new Token(TokenTypes.String, string, "", line, pos));
                ink();
                return;
            }
            if (j == c.length-1) {
                error("No end of string");
            }
            string += c[j];
            ink();
        }
    }
    function skipSpace() {
        while (i < c.length) {
            if (c[i] !== " ") {
                return;
            }
            ink();
        }
    }
    function addToken(t) {
        skipSpace();
        tokens.push(t);
    }
    function error(e, l, p) {
        interpreterSettings.error("NLexer: " + e + "\n at (MainScript.n:" + l + ":" + p + ")");
    }
    var i = 0;
    while (true) {
        if (i == c.length) {
            addToken(new Token(TokenTypes.EndOfCode, 1, "", line, pos));
            break;
        }
        else if (indentifierStartLetters.includes(c[i])) {
            processIdentifier();
        }
        else if (startNumbers.includes(c[i])) {
            processNumber();
        }
        else if (operators.includes(c[i])) {
            processOperator();
        }
        else if (c[i] == '"' && c[i-1] !== "\\") {
            processString();
        }
        else if (c[i] == "{") {
            processBrackets();
        }
        else if (c[i] == "(") {
            processRoundBrackets();
        }
        else if (c[i] == ";") {
            addToken(new Token(TokenTypes.EndOfLine, 0, "", line, pos));
            ink();
        }
        else if (c[i] == "\n") {
            line++;
            pos = 0;
            ink();
        }
        else if (c[i] == ",") {
            addToken(new Token(TokenTypes.Comma, "Comma", "", line, pos));
            ink();
        }
        else if (c[i] == " ") {
            ink();
        }
        else if (c[i] == "[") {
            processSquareBrackets();
        }
        else {
            error("NLexer: Unknown Token " + c[i], line, pos);
            break;
        }
    }
    return tokens;
}