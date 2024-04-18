var interpreterSettings = {
    log: console.log,
    error: console.error
};
var interpreterTemp = {
    args: [],
    unsArgs: [],
    scope: [],
    memory: []
};
var variableTypes = ["function", "class", "JSfunction", "object", "array", "string", "number", "bool", "void"];
function interpret(ast) {
    function linkToMemoryAdress(adress) {
        for (var m of interpreterTemp.memory) {
            if (m.adress == adress) {
                return m.value;
            }
        }
        return new Value({}, "void");
    }
    function linkToCompleteMemoryAdress(adress) {
        for (var m of interpreterTemp.memory) {
            if (m.adress == adress) {
                return m;
            }
        }
        return null;
    }
    interpreterTemp.memory = [];
    interpreterTemp.memory.push(new MemoryValue("variable", new Value({
        main: new Value({
            print: new Value(function(args) {
                if (args.length == 0) {
                    error("1 argument required, but 0 present (at N.main.print)");
                }
                interpreterSettings.log(args[0].value);
                return new Value(true, "bool");
            }, "JSfunction"),
            Object: new Value(function() {
                return new Value({}, "object", {objectType: "ClearObject"});
            }, "JSfunction"),
            Array: new Value(function() {
                var v = [];
                v.add = new Value(function(args) {
                    for (var i = 0; i < args.length; i++) {
                        this.parent.push(args[i]);
                    }
                }, "JSfunction");
                v.pull = new Value(function(args) {
                    for (var i = 0; i < args.length; i++) {
                        this.parent.unshift(args[i]);
                    }
                }, "JSfunction");
                v.add.parent = v;
                v.pull.parent = v;
                return new Value(v, "array", {objectType: "Array"});
            }, "JSfunction")
        }, "object", {adress: 0})}), 0));
    interpreterTemp.scope = {
        N: linkToMemoryAdress(0)
    };
    function error(msg) {
        interpreterSettings.error("NInterpreter: " + msg);
        throw new Error("NInterpreter: " + msg);
    }
    function expression(e, scope) {
        switch(e.type) {
            case "String":
                return new Value(e.value, "string");
            case "Number":
                return new Value(e.value, "number");
            case "FunctionCall":
                var v = call(getVar(e.name, scope), e.params, scope);
                return v;
            case "GetVariable":
                var v = getVar(e.name, scope);
                return new Value(v.value, v.type);
            case "InlineFunction":
                return new Value(new functionValue(e.params, e.code), "function");
            case "InlineClass":
                return new Value(new classValue(e.methods, e.properties), "class");
            case "MathBrackets":
                return expressions(e.code, scope);
            case "Condition":
                var a = expressions(e.a, scope).value;
                var b = expressions(e.b, scope).value;
                var o = e.operator.value;
                var ca = o == "<" && a < b;
                var cb = o == ">" && a > b;
                var cc = o == "==" && a == b;
                return new Value(ca || cb || cc, "bool");
            case "ClassInvokation":
                var c = getVar(e.name, scope).value;
                var v = {};
                for (var i = 0; i < c.methods.length; i++) {
                    var m = c.methods[i];
                    var adr = Math.random();
                    interpreterTemp.memory.push(new MemoryValue("variable", new Value(new functionValue(m.params, m.code), "function", {adress: adr}), adr));
                    v[m.name] = linkToMemoryAdress(adr);
                }
                for (var i = 0; i < c.properties.length; i++) {
                    var p = c.properties[i];
                    var adr = Math.random();
                    var x = expressions(p.code, scope);
                    x.opts = {};
                    x.opts.secureType = p.secureType;
                    x.opts.adress = adr;
                    interpreterTemp.memory.push(new MemoryValue("variable", x, adr));
                    v[p.name] = x;
                }
                var val = new Value(v, "object", {objectType: "Class"});
                for (var i in val.value) {
                    val.value[i].parent = {...val};
                }
                if (v["init"] !== undefined) {
                    call(v["init"], e.params, scope);
                }
                return val;
            default:
                error("Unknown AST-expression-type: " + e.type);
        }
    }
    function expressions(a, scope) {
        var value = "";
        var type = "";
        var opts = {};
        var i = 0;
        for (var j = 0; j < a.length; j++) {
            var e = a[j];
            if (e.type == "Operator" && ["<", ">", "=="].includes(e.value)) {
                i = j-1;
            }
        }
        while (i < a.length) {
            var e = a[i];
            if (i == 0 || a[i-1].type == "Operator") {
                var x = expression(e, scope);
                if (value == "" && type == "") {
                    value = x.value;
                    type = x.type;
                    opts = x.opts;
                }
                else {
                    if (a[i-1].type == "Operator") {
                        var o = a[i-1];
                        if (o.value == "&") {
                            type = "string";
                            value += x.value;
                        }
                        else {
                            if (type == "number" && x.type == "number" || type == "bool" && x.type == "bool") {
                                switch(o.value) {
                                    case "+":
                                        value += x.value;
                                        break;
                                    case "-":
                                        value -= x.value;
                                        break;
                                    case "*":
                                        value *= x.value;
                                        break;
                                    case "/":
                                        value /= x.value;
                                        break;
                                    case "%":
                                        value %= x.value;
                                        break;
                                    case "||":
                                        if (!value) {
                                            value = x.value;
                                        }
                                        break;
                                    case "&&":
                                        if (value) {
                                            value = x.value;
                                        }
                                        break;
                                    default:
                                        error("Unknown Operator: " + o.value);
                                }
                            }
                            else {
                                error("Cannot use mathematical operators on non-numerical values.");
                            }
                        }
                    }
                }
            }
            i++;
        }
        return new Value(value, type, opts);
    }
    function statements(a, scope) {
        var r;
        for (var i = 0; i < a.length; i++) {
            var s = a[i];
            switch(s.type) {
                case "VariableDeclaration":
                    var adr = Math.random();
                    var x = expressions(s.value, scope);
                    if (x.opts == undefined) {
                        x.opts = {};
                    }
                    x.opts.adress = {adress: adr};
                    interpreterTemp.memory.push(new MemoryValue("variable", x, adr));
                    scope[s.name] = linkToMemoryAdress(adr);
                    break;
                case "CreateObjectKey":
                    var v = getVar(s.variable, scope);
                    if (v.opts.objectType !== "ClearObject") {
                        error("Cannot change values on a " + v.opts.objectType);
                    }
                    v.value[s.key] = expressions(s.code, scope);
                    break;
                case "DeleteObjectKey":
                    var v = getVar(s.variable, scope);
                    if (v.opts.objectType !== "ClearObject") {
                        error("Cannot change values on a " + v.opts.objectType);
                    }
                    delete v.value[s.key];
                    break;
                case "FunctionCall":
                    var v = getVar(s.name, scope);
                    call(v, s.params, scope);
                    break;
                case "ChangeVariable":
                    var v = getVar(s.name, scope);
                    var x = expressions(s.code, scope);
                    var m = linkToCompleteMemoryAdress(v.opts.adress);
                    m.value = x;
                    break;
                case "FunctionDeclaration":
                    var adr = Math.random();
                    interpreterTemp.memory.push(new MemoryValue("variable", new Value(new functionValue(s.params, s.code), "function", {adress: adr}), adr));
                    scope[s.name] = linkToMemoryAdress(adr);
                    break;
                case "IfClause":
                    if (expressions(s.condition, scope).value) {
                        statements(s.code, scope);
                    }
                    break;
                case "ClassDeclaration":
                    var adr = Math.random();
                    interpreterTemp.memory.push(new MemoryValue("variable", new Value(new classValue(s.methods, s.properties), "class", {adress: adr}), adr));
                    scope[s.name] = linkToMemoryAdress(adr);
                    break;
                default:
                    error("Unknown N-statement-AST-Type: " + s.type);
            }
        }
        return r;
    }
    function getVar(name, scope) {
        var r;
        var names = [];
        for (var i = 0; i < name.length; i++) {
            names.push(expressions(name[i], scope).value);
        }
        if (scope[names[0]] == undefined) {
            error(names[0] + " is not defined.");
        }
        if (names.length == 1) {
            r = scope[names[0]];
        }
        else {
            r = readObject(names.slice(1), scope[names[0]], scope);
        }
        return r;
    }
    function readObject(name, obj, scope) {
        if (name.length == 0) {
            return obj;
        }
        if (name.length == 1) {
            if (obj == undefined || obj.value[name[0]] == undefined) {
                error(name[0] + " is not a value of this object.");
            }
            if (obj.value[name[0]] !== undefined && obj.value[name[0]].opts !== undefined && obj.value[name[0]].opts.secureType == "private") {
                error(name[0] + " is private.");
            }
            return obj.value[name[0]];
        }
        else {
            if (obj.value[name[0]] == undefined || obj.value[name[0]].opts !== undefined && obj.value[name[0]].opts.secureType == "private") {
                error(name[0] + " is not defined.");
            }
            return readObject(name.slice(1), obj.value[name[0]], scope);
        }
    }
    function setVar(name, scope, value) {
        var names = [];
        for (var i = 0; i < name.length; i++) {
            names.push(expressions(name[i], scope).value);
        }
        if (scope[names[0]] == undefined) {
            error(names[0] + " is not defined.");
        }
        if (names.length == 1) {
            scope[names[0]].value = value;
        }
        else {
            setObject(names.slice(1), scope[names[0]], scope, value);
        }
    }
    function setObject(name, obj, scope, value) {
        if (name.length == 0) {
            return obj;
        }
        if (name.length == 1) {
            if (obj == undefined || obj.value[name[0]] == undefined) {
                error(name[0] + " is not a value of this object.");
            }
            if (obj.value[name[0]] !== undefined && obj.value[name[0]].opts !== undefined && obj.value[name[0]].opts.secureType == "private") {
                error(name[0] + " is private.");
            }
            obj.value[name[0]].value = value;
        }
        else {
            if (obj.value[name[0]] == undefined || obj.value[name[0]].opts !== undefined && obj.value[name[0]].opts.secureType == "private") {
                error(name[0] + " is not defined.");
            }
            setObject(name.slice(1), obj.value[name[0]], scope, value);
        }
    }
    function call(f, a, scope) {
        if (f.type !== "function" && f.type !== "JSfunction") {
            error("Cannot execute function that is not of type function or JSfunction.");
        }
        var args = [];
        for (var arg of a) {
            args.push(expressions(arg, scope));
        }
        if (f.type == "JSfunction") {
            return f.value(args);
        }
        else {
            var scp = Object.assign({}, scope);
            for (var i = 0; i < f.value.params.length; i++) {
                scp[f.value.params[i]] = args[i];
            }
            if (f.parent !== undefined) {
                for (var i in f.parent.value) {
                    var val = f.parent.value[i];
                    if (val.opts == undefined || val.opts.adress == undefined) {
                        scp[i] = f.parent.value[i];
                    }
                    else {
                        scp[i] = linkToMemoryAdress(val.opts.adress);
                    }
                }
            }
            return statements(f.value.code, {...scp});
        }
    }
    statements(ast, interpreterTemp.scope);
}
class MemoryValue {
    constructor(type, value, adress) {
        this.type = type;
        this.value = value;
        this.adress = adress;
        this.references = 0;
    }
}
class classValue {
    constructor(methods, properties) {
        this.methods = methods;
        this.properties = properties;
    }
}
class functionValue {
    constructor(params, code) {
        this.params = params;
        this.code = code;
    }
}
class Value {
    constructor(value, type, opts) {
        this.type = type;
        this.value = value;
        this.opts = opts;
        switch(type) {
            case "object":
                this.value["presentationValue"] = "{Object}";
                break;
            case "function":
                this.value["presentationValue"] = "{Function}";
                break;
            case "class":
                this.value["presentationValue"] = "{Class}";
                break;
            case "JSfunction":
                this.value["presentationValue"] = "{JSfunction}";
                break;
            case "array":
                this.value["presentationValue"] = "{Array}";
                break;
            case "void":
                this.value = "{void}";
                break;
        }
    }
}