let tests = []
let passed = 0;
let failed = 0;

class Test {
    events = []
    constructor(code) {
        let script = document.currentScript
        this.node = script.parentElement
        this.code = code
    }

    start() {
        this.code(this)
    }

    assertEq(actual, expected, trim) {
        if (expected !== (trim ? actual?.trim() : actual)) {
            this.node.classList.add("failed")
            this.node.insertAdjacentHTML('beforeend', `<p>ERROR: Expected ${expected} found ${actual}</p>`)
            document.querySelector(".failed-info").querySelector("output").innerText = ++failed
        } else {
            this.node.classList.add("passed");
            this.node.insertAdjacentHTML('beforeend', `<p>Passed</p>`)
            document.querySelector(".passed-info").querySelector("output").innerText = ++passed
        }
    }

    off() {
        for (let [el, event, fn] of this.events) {
            el.removeEventListener(event, fn)
        }
    }

    on(el, event, fn) {
        this.events.push([el, event, fn])
        el.addEventListener(event, fn)
    }

    find(selector) {
        let result = this.node.querySelector(selector)
        return result
    }
}

function test(code) {
    tests.push(new Test(code))
}

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => resolve(true), time)
    })
}

document.addEventListener('DOMContentLoaded', async () => {
    let $header = document.querySelector("header")
    $header.insertAdjacentHTML("beforeend", `
<div>
    <div class="passed-info">Passed: <output></output></div>
    <div class="failed-info">Failed: <output></output></div>
    <a href="javascript:document.body.classList.toggle('hide-passed')">Toggle Passed</a><br />
    <a href="/">Run All</a>
</div>`)
    let testIndex = location.search.slice(5)
    if (testIndex === '') {
        testIndex = -1
    } else {
        testIndex = +testIndex
    }

    for (let i = 0; i < document.querySelectorAll(".test").length; i++){
        const testBlock = document.querySelectorAll(".test")[i];
        testBlock.querySelector("h3").insertAdjacentHTML("beforeend", ` - <a id='test${i}' href="/?test${i}">run</a>`)
        let scriptElt = testBlock.querySelector("script");
        scriptElt.insertAdjacentHTML("beforebegin", `<b>Code:</b><pre></pre>`)
        scriptElt.previousElementSibling.innerText = scriptElt.innerText.replaceAll(/^ {8}/gm, '') + "\n";
        if (testIndex > -1) {
            if (testIndex === i) {
                testBlock.scrollIntoView()
            }
        }
    }

    if (testIndex > -1) {
        tests[testIndex]?.start()
    } else {
        for (let test of tests) {
            test.start()
        }
    }
});