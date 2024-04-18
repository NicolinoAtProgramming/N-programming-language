var AST = {
    Condition: class {
        constructor(a, b, operator, l, p) {
            this.a = a;
            this.b = b;
            this.operator = operator;
            this.type = "Condition";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    IfClause: class {
        constructor(c, code, l, p) {
            this.condition = c;
            this.code = code;
            this.type = "IfClause";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    VariableDeclaration: class {
        constructor(name, value, type, l, p) {
            this.name = name;
            this.value = value;
            this.variableType = type;
            this.type = "VariableDeclaration";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    ClassDeclaration: class {
        constructor(name, methods, properties, l, p) {
            this.name = name;
            this.properties = properties;
            this.methods = methods;
            this.type = "ClassDeclaration";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    InlineClass: class {
        constructor(methods, properties, l, p) {
            this.properties = properties;
            this.methods = methods;
            this.type = "InlineClass";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    ClassPropertyDeclaration: class {
        constructor(name, code, secureType, l, p) {
            this.name = name;
            this.code = code;
            this.secureType = secureType;
            this.type = "ClassPropertyDeclaration";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    ClassMethodDeclaration: class {
        constructor(name, code, p, l, ps) {
            this.type = "ClassMethodDeclaration";
            this.name = name;
            this.code = code;
            this.params = p;
            this.line = l;
            this.pos = ps;
            this.value = new AST.InlineFunction(code, p, l, ps);
            this.id = Math.random();
        }
    },
    ClassInvokation: class {
        constructor(name, params, p, l) {
            this.name = name;
            this.params = params;
            this.line = l;
            this.pos = p;
            this.type = "ClassInvokation";
            this.id = Math.random();
        }
    },
    DeleteFromScope: class {
        constructor(name, l, p) {
            this.name = name;
            this.type = "DeleteFromScope";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    GetVariable: class {
        constructor(name, l, p) {
            this.name = name;
            this.type = "GetVariable";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    ChangeVariable: class {
        constructor(name, code, l, p) {
            this.name = name;
            this.type = "ChangeVariable";
            this.code = code;
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    CreateObjectKey: class {
        constructor(key, variable, code, l, p) {
            this.type = "CreateObjectKey";
            this.key = key;
            this.variable = variable;
            this.code = code;
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    DeleteObjectKey: class {
        constructor(key, variable, l, p) {
            this.type = "DeleteObjectKey";
            this.key = key;
            this.variable = variable;
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    MathBrackets: class {
        constructor(code, l, p) {
            this.code = code;
            this.line = l;
            this.pos = p;
            this.type = "MathBrackets";
            this.id = Math.random();
        }
    },
    String: class {
        constructor(value, l, p) {
            this.value = value;
            this.type = "String";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    Number: class {
        constructor(value, l, p) {
            this.value = value;
            this.type = "Number";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    Operator: class {
        constructor(t, l, p) {
            this.value = t;
            this.type = "Operator";
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    FunctionCall: class {
        constructor(n, p, l, ps) {
            this.name = n;
            this.params = p;
            this.type = "FunctionCall";
            this.line = l;
            this.pos = ps;
            this.id = Math.random();
        }
    },
    FunctionDeclaration: class {
        constructor(name, code, p, l, ps) {
            this.type = "FunctionDeclaration";
            this.name = name;
            this.code = code;
            this.params = p;
            this.line = l;
            this.pos = ps;
            this.value = new AST.InlineFunction(code, p, l, ps);
            this.id = Math.random();
        }
    },
    InlineFunction: class {
        constructor(code, p, l, ps) {
            this.type = "InlineFunction";
            this.code = code;
            this.params = p;
            this.line = l;
            this.pos = ps;
            this.value = {
                code: this.code,
                params: this.params
            };
            this.id = Math.random();
        }
    },
    Return: class {
        constructor(code, l, p) {
            this.type = "Return";
            this.code = code;
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    Object: class {
        constructor(l, p) {
            this.type = "Object";
            this.value = {};
            this.line = l;
            this.pos = p;
            this.id = Math.random();
        }
    },
    Tree: class {
        constructor() {
            this.code = [];
            this.id = Math.random();
        }
    },
    processGetObject: function(n, s) {
        return n.split(s);
    }
};