
class Query {
    nodes
    constructor(nodes: Element[] = []) {
        this.nodes = nodes
    }

    addClass(className: string) {
        this.nodes.forEach(x => x.classList.add(className))
        return this
    }

    removeClass(className: string) {
        this.nodes.forEach(x => x.classList.remove(className))
        return this
    }

    classWhen(className: string, condition: boolean) {
        if (condition) {
            this.addClass(className)
        } else {
            this.removeClass(className)
        }
        return this
    }

    closest(selector: string) {
        return query(this.nodes[0]?.closest(selector))
    }

    find(selector: string) {
        return this.nodes[0]
            ? query(selector, this.nodes[0])
        : query()
    }

    focus() {
        const el = this.nodes[0]
        if (el instanceof HTMLElement) {
            el.focus()
        }
        return this
    }

    get length() {
        return this.nodes.length
    }

    text(value: any) {
        this.nodes.forEach(x => {
            x.textContent = value ?? ""
        })
        return this
    }

    html(value: any) {
        this.nodes.forEach(x => {
            x.innerHTML = value ?? ""
        })
        return this
    }

    [Symbol.iterator]() {
        let index = -1;
        let nodes  = this.nodes

        return {
            next: () => ({
                value: nodes[++index],
                done: !(index in nodes)
            })
        }
    }
}

export default function query(val : string | Element | null = null, el: Element | null = null) {
    if (val == null) {
        return new Query([])
    }
    if (val instanceof Element) {
        return new Query([val])
    }
    return new Query(Array.from((el ?? document).querySelectorAll(val)))
}

query.ESC_KEY = 27
query.ENTER_KEY = 13

// @ts-ignore
window.$ = query

export type QueryFunc = typeof query

declare global {
    interface Window {
        $: QueryFunc
    }
}

