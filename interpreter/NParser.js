function parse(tk, opts = {}) {
    var output = [];
    var ignoreTypes = ["EndOfLine", "EndOfCode"];
    function error(e, line = 0, ind = 0) {
        interpreterSettings.error("NParser: " + e + " at line " + line + " position " + ind);
        throw new Error();
    }
    for (var i = 0; i < tk.length; i++) {
        var t = tk[i];
        if (ignoreTypes.includes(t.type)) {
            continue;
        }
        function untilNextLine() {
            var code = [];
            while (true) {
                if (tk[i] == undefined) {
                    error("No end of declaration", tk[i].line, tk[i].pos);
                }
                if (tk[i].type == "EndOfLine") {
                    break;
                }
                else {
                    code.push(tk[i]);
                }
                i++;
            }
            return code;
        }
        function getLastOfComparison() {
            var code = [];
            while (true) {
                if (tk[i] == undefined || tk[i].type == "EndOfLine" || tk[i].type == "EndOfCode" || tk[i].type == "LogOr" || tk[i].type == "LogAnd") {
                    break;
                }
                else {
                    code.push(tk[i]);
                }
                i++;
            }
            return code;
        }
        switch(t.type) {
            case "Identifier":
                switch(t.value) {
                    case "declare":
                        var name = tk[i+1].value;
                        i+=3;
                        output.push(new AST.VariableDeclaration(name, parse(untilNextLine()), "", t.line, t.pos));
                        break;
                    case "create":
                        if (tk[i+2].value == "of" && tk[i+1].type == "Identifier" && tk[i+3].type == "Identifier") {
                            var name = tk[i+1].value;
                            var variable = varName(tk[i+3].value);
                            i+=5;
                            output.push(new AST.CreateObjectKey(name, variable, parse(untilNextLine()), t.line, t.pos));
                        }
                        else {
                            error("Invalid CreateObjectKey-declaration", t.line, t.pos);
                        }
                        break;
                    case "delete":
                        if (tk[i+2].value == "of" && tk[i+1].type == "Identifier" && tk[i+3].type == "Identifier") {
                            var name = tk[i+1].value;
                            var variable = varName(tk[i+3].value);
                            i+=4;
                            output.push(new AST.DeleteObjectKey(name, variable, t.line, t.pos));
                        }
                        else {
                            error("Invalid DeleteObjectKey-declaration", t.line, t.pos);
                        }
                        break;
                    case "class":
                        if (tk[i+1].type == "Identifier") {
                            if (tk[i+2].type == "CodeBlock") {
                                if (tk[i+3] == undefined || tk[i+3].type !== "EndOfLine") {
                                    error("Semicolons are required after classes.");
                                }
                                var code = parseClass(tk[i+2].value);
                                output.push(new AST.ClassDeclaration(tk[i+1].value, code.methods, code.properties, t.line, t.pos));
                                i+=3;
                            }
                            else {
                                error("Unexpected class.");
                            }
                        }
                        else if (tk[i+1].type == "CodeBlock") {
                            if (tk[i+2] == undefined || tk[i+2].type !== "EndOfLine") {
                                error("Semicolons are required after classes.");
                            }
                            var code = parseClass(tk[i+1].value);
                            output.push(new AST.InlineClass(code.methods, code.properties, t.line, t.pos));
                            i+=3;
                        }
                        else {
                            error("Unexpected class.");
                        }
                        break;
                    case "if":
                        var cond = parse(tk[i+1].value);
                        var code = parse(tk[i+2].value);
                        output.push(new AST.IfClause(cond, code, t.line, t.pos));
                        i+=2;
                        break;
                    case "function":
                        if (tk[i+1].type == "RoundBrackets") {
                            var params = tk[i+1].value;
                            var p = [];
                            for (var j = 0; j < params.length; j++) {
                                if (params[j].type == "Identifier") {
                                    p.push(params[j].value);
                                }
                            }
                            var code = parse(tk[i+2].value);
                            output.push(new AST.InlineFunction(code, p, t.line, t.pos));
                            i+=2;
                        }
                        else if (tk[i+2].type == "RoundBrackets") {
                            var name = tk[i+1].value;
                            var params = tk[i+2].value;
                            var p = [];
                            for (var j = 0; j < params.length; j++) {
                                if (params[j].type == "Identifier") {
                                    p.push(params[j].value);
                                }
                            }
                            var code = parse(tk[i+3].value);
                            output.push(new AST.FunctionDeclaration(name, code, p, t.line, t.pos));
                            i+=3;
                        }
                        else {
                            error("Invalid function declaration", t.line, t.pos);
                        }
                        break;
                    case "return":
                        i+=1;
                        output.push(new AST.Return(parse(untilNextLine()), t.line, t.pos));
                        break;
                    default:
                        if (tk[i+1] !== undefined && tk[i+1].type == "Equal") {
                            i+=2;
                            output.push(new AST.ChangeVariable(varName(t.value), parse(untilNextLine()), t.line, t.pos));
                        }
                        else if (tk[i+1] !== undefined && tk[i+1].type == "RoundBrackets") {
                            var code = [];
                            var np = [];
                            for (var j = 0; j < tk[i+1].value.length; j++) {
                                if (tk[i+1].value[j].type == "Comma" || tk[i+1].value[j].type == "EndOfCode" && np.length > 0) {
                                    code.push(parse(np));
                                    np = [];
                                    continue;
                                }
                                else {
                                    np.push(tk[i+1].value[j]);
                                }
                            }
                            if (i > 0 && tk[i-1].value == "new") {
                                output.pop();
                                output.push(new AST.ClassInvokation(varName(t.value), code, t.line, t.pos));
                            }
                            else {
                                output.push(new AST.FunctionCall(varName(t.value), code, t.line, t.pos));
                            }
                            i+=1;
                        }
                        else {
                            output.push(new AST.GetVariable(varName(t.value), t.line, t.pos));
                        }
                }
                break;
            case "And":
                output.push(new AST.Operator("&", t.line, t.pos));
                break;
            case "String":
                output.push(new AST.String(t.value, t.line, t.pos));
                break;
            case "Number":
                output.push(new AST.Number(parseFloat(t.value), t.line, t.pos));
                break;
            case "Plus":
                output.push(new AST.Operator("+", t.line, t.pos));
                break;
            case "Minus":
                output.push(new AST.Operator("-", t.line, t.pos));
                break;
            case "Multiply":
            case "Divide":
                if (opts.dontPredence !== true) {
                    output.pop();
                    output.push(new AST.MathBrackets(parse(tk.slice(i-1, i+2), {dontPredence: true}), t.line, t.pos));
                    i++;
                }
                else {
                    var comSet = {
                        Multiplay: "*",
                        Divide: "/"
                    };
                    output.push(new AST.Operator(comSet[t.type], t.line, t.pos));
                }
                break;
            case "Modulus":
                output.push(new AST.Operator("%", t.line, t.pos));
                break;
            case "Bigger":
            case "Smaller":
            case "Same":
                if (!opts.insideBrackets) {
                    error("Cannot use comparisons outside Brackets.");
                }
                var comSet = {
                    Bigger: ">",
                    Smaller: "<",
                    Same: "=="
                };
                i++;
                var bf = output;
                var af = parse(getLastOfComparison());
                return [new AST.Condition(bf, af, new AST.Operator(comSet[t.type], t.line, t.pos), t.line, t.pos)];
            case "RoundBrackets":
                output.push(new AST.MathBrackets(parse(t.value, {insideBrackets: true})));    
                break;
            case "LogAnd":
                output.push(new AST.Operator("&&", t.line, t.pos));
                break;
            case "LogOr":
                output.push(new AST.Operator("||", t.line, t.pos));
                break;
            default:
                error("Unknown TokenType: " + t.type, t.line, t.pos);
        }
    }
    return output;
}
function parseClass(code) {
    var cd = [];
    var didMethod = false;
    var methods = [];
    var props = [];
    for (var i = 0; i < code.length; i++) {
        var t = code[i];
        function untilNextLine() {
            var c = [];
            while (true) {
                if (code[i] == undefined) {
                    error("No end of declaration (at class)");
                }
                if (code[i].type == "EndOfLine") {
                    break;
                }
                else {
                    c.push(code[i]);
                }
                i++;
            }
            return c;
        }
        if (t.type == "Identifier") {
            if (code[i+1].type == "Equal") {
                if (didMethod) {
                    error("Property declarations only at the top.");
                }
                var name = t.value;
                var st = "public";
                if (code[i-1] !== undefined && ["public", "private"].includes(code[i-1].value)) {
                    st = code[i-1].value;
                }
                i+=2;
                var c = parse(untilNextLine());
                props.push(new AST.ClassPropertyDeclaration(name, c, st, t.line, t.pos));
            }
            else if (code[i+1].type == "RoundBrackets") {
                if (code[i+2].type !== "CodeBlock") {
                    error("Invalid class-method declaration.");
                }
                var name = t.value;
                var p = code[i+1].value;
                var params = [];
                for (var j = 0; j < p.length; j++) {
                    if (p[j].type == "Identifier") {
                        params.push(p[j].value);
                    }
                }
                methods.push(new AST.ClassMethodDeclaration(name, parse(code[i+2].value), params, t.line, t.pos));
                i+=2;
                didMethod = true;
            }
            else if (code[i].value !== "private") {
                error("Unexpected " + code[i+1].type + ".");
            }
        }
        else if (t.type !== "EndOfLine" && t.type !== "EndOfCode") {
            error("Unexpected Token: " + t.value + "(" + t.type + ")");
        }
    }
    return {properties: props, methods};
}
function varName(name) {
    var seperator = ".";
    var f = [];
    var stringNow = "";
    var listNow = [];
    var dontSeperator = false;
    for (var i = 0; i < name.length; i++) {
        if (i == name.length-1 && name[i] !== "]" && name[i] !== seperator) {
            stringNow += name[i];
        }
        if (!dontSeperator && (name[i] == seperator || i == name.length-1 || name[i] == "[")) {
            if (name[i] == "[") {
                dontSeperator = true;
            }
            f.push([new AST.String(stringNow)]);
            stringNow = "";
        }
        else if (name[i] == "]") {
            f.push(parse(lex(stringNow)));
            listNow = [];
            stringNow = "";
            dontSeperator = false;
            i+=1;
        }
        else {
            stringNow += name[i];
        }
    }
    return f;
}