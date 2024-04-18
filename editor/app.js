interpreterSettings.log = log;
interpreterSettings.error = error;
var code = document.getElementById("code");
var con = document.getElementById("con");
var canHighlight = true;
function handleResize() {
    code.style.width = innerWidth/2 + "px";
    code.style.height = innerHeight-60 + "px";
    highlightCode.style.width = innerWidth/2 + "px";
    highlightCode.style.height = innerHeight-60 + "px";
    con.style.width = (innerWidth/2 - 10) + "px";
    con.style.height = innerHeight-60 + "px";
}
function log(a) {
    var c = document.createElement("div");
    c.classList.add("msg");
    c.innerHTML = a;
    con.appendChild(c);
}
function error(a) {
    var c = document.createElement("div");
    c.classList.add("msg");
    c.classList.add("error");
    c.innerHTML = a;
    con.appendChild(c);
}
function run() {
    con.innerHTML = "";
    interpret(parse(lex(code.value)));
}
code.onkeydown = function(e) {
    if (e.key == "Tab") {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      var num = 6;
      this.value = this.value.substring(0, start) + " ".repeat(num) + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + num;
    }
  }
setInterval(function() {
    if (!canHighlight) {
        return;
    }
    var cd = code.value;
    var nc = "";
    var keywords = ["class", "function", "create", "of", "declare", "delete", "new"];
    for (var i = 0; i < cd.length; i++) {
        var c = cd[i];
        if (c == "\n") {
            nc += "<br>"
            if (i == cd.length-1) {
                nc += "&nbsp;";
            }
        }
        else if (c == " "){
            nc += "&nbsp;";
        }
        else {
            var isKeyword = false;
            for (var j = 0; j < keywords.length; j++) {
                if (cd.substr(i, keywords[j].length) == keywords[j]) {
                    nc += "<span class='keyword'>" + keywords[j] + "</span>";
                    i += keywords[j].length - 1;
                    isKeyword = true;
                    break;
                }
            }
            if (!isKeyword) {
                nc += c;
            }
        }
    }
    highlightCode.innerHTML = nc;
}, 100);
code.onscroll = function() {
    highlightCode.scrollTop = code.scrollTop;
    highlightCode.scrollLeft = code.scrollLeft;
};
highlightCode.onscroll = function() {
    code.scrollTop = highlightCode.scrollTop;
    code.scrollLeft = highlightCode.scrollLeft;
};
onresize = handleResize;
handleResize();