import { Dispatcher, listOf, loop, stateOf } from "../../lib/jetz.js";
import { button, css, div, h2, li, p, span, ul } from "../../lib/jetz-ui.js";
import { codeBlock, lesson, lessonExample } from "./docs-layout.js";

const CARD = css`w-full max-w-sm rounded-xl border border-zinc-700 bg-[#09090b] p-5`;
const EYEBROW = css`text-xs font-semibold uppercase tracking-wider text-emerald-400`;

function tutorial(title, summary, source, explanation) {
    return div(css`mt-8`,
        h2(css`text-xl font-semibold text-white`, title),
        p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`, summary),
        div(css`mt-4`, codeBlock(source, "javascript", "Example.js", "JAVASCRIPT", explanation))
    );
}

export function DocsGlobalState() {
    return lesson("/docs/global-state", "Application", "Global state with Dispatcher",
        "A store in its own module is shared by the whole app: every file that imports it receives the same instances, so a change made in one component is visible everywhere at once. This walkthrough builds a real shopping-cart store step by step — action names, store slices, a derived receipt, and the components that use it. The finished store runs live at the end of the page.",
        tutorial(
            "1. Name your actions",
            "An action is a short string describing what happened. Keep them in one file so product pages, tests, and devtools all agree on the same vocabulary. A namespace prefix such as cart/ avoids collisions as the app grows.",
            '// store/actions.js — the vocabulary of your app\n\n' +
            'export const CART = {\n' +
            '  ADD: "cart/add",\n' +
            '  REMOVE: "cart/remove",\n' +
            '  CHECKOUT: "cart/checkout"\n' +
            '};',
            "Actions are plain strings — no classes or constants library needed. Because they live in one module, a typo becomes an import error instead of a silently ignored dispatch."
        ),
        tutorial(
            "2. Create the store and its first slice",
            "The store module creates the Dispatcher and the state it owns, then subscribes a handler for each slice of that state. The cart slice listens for add and remove actions and mutates the shared list. The token \"cart\" lets other slices depend on it in the next step.",
            '// store/cartStore.js\n' +
            'import { Dispatcher, listOf } from "@daevsoft/jetz";\n' +
            'import { CART } from "./actions.js";\n\n' +
            '// Created once — every importer shares these instances\n' +
            'export const cart = listOf();\n' +
            'export const cartStore = new Dispatcher();\n\n' +
            '// Slice: owns the list\n' +
            'cartStore.subscribe("cart", (action, payload) => {\n' +
            '  if (action === CART.ADD)\n' +
            '    cart.push({ id: Date.now(), title: payload.title, price: payload.price });\n\n' +
            '  if (action === CART.REMOVE) {\n' +
            '    const item = cart.find(i => i.id === payload.id)[0];\n' +
            '    if (item) cart.remove(item);\n' +
            '  }\n' +
            '});',
            "The module body runs once on first import, so cart and cartStore are singletons. The handler ignores actions it does not handle — each slice guards with if (action === ...) before touching its own state."
        ),
        tutorial(
            "3. Derive a summary with waitFor()",
            "A second slice keeps a receipt line in sync with the cart. waitFor(\"cart\") guarantees the list is already up to date before the receipt is recalculated, regardless of the order the slices were registered in.",
            '// store/cartStore.js — appended slice\n' +
            'import { stateOf } from "@daevsoft/jetz";\n\n' +
            'export const receipt = stateOf("Add a product to start.");\n\n' +
            'cartStore.subscribe("receipt", (action) => {\n' +
            '  cartStore.waitFor("cart"); // list is settled first\n\n' +
            '  if (action === CART.ADD || action === CART.REMOVE) {\n' +
            '    let total = 0;\n' +
            '    for (const item of cart) total += item.price;\n' +
            '    receipt.value = `${cart.size} item(s) — total $${total.toFixed(2)}`;\n' +
            '  }\n\n' +
            '  if (action === CART.CHECKOUT) receipt.value = "Thanks for your order!";\n' +
            '});',
            "waitFor() runs the \"cart\" slice to completion before this handler continues, so the receipt never counts a stale list. The CHECKOUT action is also handled by the cart slice (cart.clear()), which is why the receipt can simply thank the customer."
        ),
        tutorial(
            "4. Dispatch from any component",
            "Components never touch each other — they dispatch actions and render state. A product button lives far away from the cart panel, yet both operate on the same shared store. No events, no prop drilling, no globals on window.",
            '// product-card.js — adding happens far from the cart panel\n' +
            'import { CART } from "./store/actions.js";\n' +
            'import { cartStore } from "./store/cartStore.js";\n' +
            'import { button } from "@daevsoft/jetz/ui";\n\n' +
            'button("Add coffee", {\n' +
            '  onclick: () => cartStore.dispatch(CART.ADD, { title: "Coffee", price: 4.5 })\n' +
            '});\n\n' +
            '// cart-panel.js — reads the same shared state\n' +
            'import { CART } from "./store/actions.js";\n' +
            'import { cart, cartStore, receipt } from "./store/cartStore.js";\n' +
            'import { button, div, li, loop, p, ul } from "@daevsoft/jetz/ui";\n\n' +
            'div(\n' +
            '  p(receipt),\n' +
            '  ul(loop(cart, item => item.id, item => li(\n' +
            '    `${item.title} — $${item.price.toFixed(2)}`,\n' +
            '    button("Remove", {\n' +
            '      onclick: () => cartStore.dispatch(CART.REMOVE, { id: item.id })\n' +
            '    })\n' +
            '  ))),\n' +
            '  button("Checkout", {\n' +
            '    onclick: () => cartStore.dispatch(CART.CHECKOUT)\n' +
            '  })\n' +
            ');',
            "Both components import from the same store module, so they share one cart list and one receipt. Dispatching CART.ADD from the product card updates the panel instantly — the \"cart\" and \"receipt\" slices both ran before the next paint."
        ),
        div(css`mt-8`,
            h2(css`text-xl font-semibold text-white`, "5. Try the finished store"),
            p(css`mt-2 max-w-3xl text-sm leading-7 text-zinc-400`, "The live example below wires the steps together: product buttons dispatch add, each row dispatches remove, and checkout clears the cart. The receipt slice always sees the settled list — click around and watch it stay in sync."),
            div(css`mt-4`, lessonExample(
                '// store/cartStore.js — the complete store\n' +
                'import { Dispatcher, listOf, stateOf } from "@daevsoft/jetz";\n' +
                'import { CART } from "./actions.js";\n\n' +
                'export const cart = listOf();\n' +
                'export const receipt = stateOf("Add a product to start.");\n' +
                'export const cartStore = new Dispatcher();\n\n' +
                'cartStore.subscribe("cart", (action, payload) => {\n' +
                '  if (action === CART.ADD)\n' +
                '    cart.push({ id: Date.now(), title: payload.title, price: payload.price });\n' +
                '  if (action === CART.REMOVE) {\n' +
                '    const item = cart.find(i => i.id === payload.id)[0];\n' +
                '    if (item) cart.remove(item);\n' +
                '  }\n' +
                '  if (action === CART.CHECKOUT) cart.clear();\n' +
                '});\n\n' +
                'cartStore.subscribe("receipt", (action) => {\n' +
                '  cartStore.waitFor("cart");\n' +
                '  if (action === CART.ADD || action === CART.REMOVE) {\n' +
                '    let total = 0;\n' +
                '    for (const item of cart) total += item.price;\n' +
                '    receipt.value = `${cart.size} item(s) — total $${total.toFixed(2)}`;\n' +
                '  }\n' +
                '  if (action === CART.CHECKOUT) receipt.value = "Thanks for your order!";\n' +
                '});',
                GlobalCartDemo(),
                "One Dispatcher, two slices, one shared list. Product buttons dispatch CART.ADD, each row dispatches CART.REMOVE, and Checkout dispatches CART.CHECKOUT which clears the list — the receipt slice recalculates after the cart slice in every case."
            ))
        )

    );
}

function GlobalCartDemo() {
    const CART = { ADD: "cart/add", REMOVE: "cart/remove", CHECKOUT: "cart/checkout" };

    const cart = listOf();
    const receipt = stateOf("Add a product to start.");
    const cartStore = new Dispatcher();

    cartStore.subscribe("cart", (action, payload) => {
        if (action === CART.ADD)
            cart.push({ id: Date.now(), title: payload.title, price: payload.price });
        if (action === CART.REMOVE) {
            const item = cart.find(i => i.id === payload.id)[0];
            if (item) cart.remove(item);
        }
        if (action === CART.CHECKOUT) cart.clear();
    });

    cartStore.subscribe("receipt", (action) => {
        cartStore.waitFor("cart");
        if (action === CART.ADD || action === CART.REMOVE) {
            let total = 0;
            for (const item of cart) total += item.price;
            receipt.value = `${cart.size} item(s) — total $${total.toFixed(2)}`;
        }
        if (action === CART.CHECKOUT) receipt.value = "Thanks for your order!";
    });

    const products = [
        { title: "Coffee", price: 4.5 },
        { title: "Bagel", price: 3 },
        { title: "Juice", price: 2.5 }
    ];

    return div(CARD,
        span(EYEBROW, "Shared cart store"),
        div(css`mt-4 flex flex-wrap gap-2`,
            ...products.map(item => button(`${item.title} — $${item.price.toFixed(2)}`, {
                type: "button",
                onclick: () => cartStore.dispatch(CART.ADD, { title: item.title, price: item.price })
            }))
        ),
        p(css`mt-3 text-sm text-zinc-300`, receipt),
        div(css`mt-3 space-y-1`,
            loop(cart, item => item.id, item => div(css`flex items-center justify-between text-sm text-zinc-300`,
                p(css`flex-1`, `${item.title} — $${item.price.toFixed(2)}`),
                button("✕", {
                    type: "button",
                    onclick: () => cartStore.dispatch(CART.REMOVE, { id: item.id })
                })
            ))
        ),
        button("Checkout", {
            type: "button",
            onclick: () => cartStore.dispatch(CART.CHECKOUT)
        })
    );

}
