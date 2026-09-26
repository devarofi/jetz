import { Jetz, ifElse, listOf, loop, stateOf } from "../../lib/jetz.js";
import { link } from "../../lib/jetz-router.js";
import {
    a, alt, br, button, css, div, footer, form, h1, h2, h3, h4, header, href,
    i, img, input, label, li, main, nav, p, placeholder, small, span, src,
    strong, type, ul,
} from "../../lib/jetz-ui.js";

// ---------------------------------------------------------------------------
// data + state (mirrors template_demo/home-page.html)
// ---------------------------------------------------------------------------

const PRODUCTS = [
    { id: 1, title: "SaaS Pro UI Kit", type: "Figma File", author: "UI Ninja", price: 49.00, rating: 4.9, img: "https://placehold.co/600x400/4f46e5/ffffff?text=Figma+UI+Kit", icon: "fa-brands fa-figma" },
    { id: 2, title: "Advanced React Patterns", type: "E-Book (PDF)", author: "Code Master", price: 29.00, rating: 4.8, img: "https://placehold.co/600x400/111827/ffffff?text=React+E-Book", icon: "fa-solid fa-file-pdf" },
    { id: 3, title: "E-Commerce Backend API", type: "Source Code (Node.js)", author: "Backend Bros", price: 79.00, rating: 5.0, img: "https://placehold.co/600x400/059669/ffffff?text=Node.js+API", icon: "fa-solid fa-code" },
    { id: 4, title: "Moody Lightroom Presets", type: "Design Assets", author: "Photo Magic", price: 15.00, rating: 4.7, img: "https://placehold.co/600x400/db2777/ffffff?text=LR+Presets", icon: "fa-solid fa-image" },
    { id: 5, title: "Startup Pitch Deck", type: "Presentation (PPTX)", author: "Biz Templates", price: 25.00, rating: 4.6, img: "https://placehold.co/600x400/ea580c/ffffff?text=Pitch+Deck", icon: "fa-solid fa-file-powerpoint" },
    { id: 6, title: "Ultimate 3D Icon Pack", type: "Design Assets", author: "3D Wizards", price: 35.00, rating: 4.9, img: "https://placehold.co/600x400/8b5cf6/ffffff?text=3D+Icons", icon: "fa-solid fa-cubes" },
];

const cart = listOf();
const products = listOf(...PRODUCTS);
const cartCount = stateOf(0);
const cartTotal = stateOf(0);
const cartOpen = stateOf(false);
const successOpen = stateOf(false);
const processing = stateOf(false);
const searchQuery = stateOf('');

function addToCart(product) {
    cart.push(product);
    cartCount.value = cart.values.length;
    cartTotal.value = cart.values.reduce((sum, item) => sum + item.price, 0);
}

function openCheckout() {
    if (cartCount.value === 0) {
        alert("Your cart is empty! Add some digital products first.");
        return;
    }
    cartOpen.value = true;
}

function closeCheckout() {
    cartOpen.value = false;
}

function closeSuccess() {
    successOpen.value = false;
}

function processPayment(event) {
    event.preventDefault();
    if (processing.value) return;
    processing.value = true;
    setTimeout(() => {
        processing.value = false;
        cart.set([]);
        cartCount.value = 0;
        cartTotal.value = 0;
        closeCheckout();
        successOpen.value = true;
        event.target.reset();
    }, 1500);
}

function productMatches(product, query = searchQuery.value) {
    const keyword = String(query ?? '').trim().toLowerCase();
    if (!keyword) return true;
    return product.title.toLowerCase().includes(keyword) || product.type.toLowerCase().includes(keyword);
}

/** Filters the rendered product grid (keeps `products` as the single source of truth). */
function applySearch(event) {
    const query = event?.target?.value ?? searchQuery.value;
    products.set(PRODUCTS.filter(product => productMatches(product, query)));
}

// ---------------------------------------------------------------------------
// navbar
// ---------------------------------------------------------------------------

function navbar() {
    let stickyMenu;
    const menuButton = button({ id: 'mobile-menu-btn', type: 'button' },
        css`inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200`,
        {
            'aria-controls': 'navbar-sticky',
            onclick() { stickyMenu.toggleClass('hidden'); }
        },
        span(css`sr-only`, 'Open main menu'),
        i(css`fa-solid fa-bars text-xl`)
    );
    stickyMenu = div({ id: 'navbar-sticky', class: 'items-center justify-between hidden w-full md:flex md:w-auto md:order-1' },
        ul(css`flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg md:space-x-8 md:flex-row md:mt-0 md:border-0`,
            li(link('/', a(href`#`, css`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors`, 'Discover'))),
            li(link('landing', a(href`#`, css`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors`, 'Categories'))),
            li(link('counter', a(href`#`, css`block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary md:p-0 transition-colors`, 'My Assets')))
        ),
        div(css`flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0 md:ml-8 border-t md:border-t-0 pt-4 md:pt-0 border-gray-200`,
            button(css`relative text-gray-600 hover:text-primary transition-colors flex items-center gap-2`, { onclick: openCheckout },
                i(css`fa-solid fa-cart-shopping text-xl`),
                span(css`md:hidden font-medium`, 'Cart'),
                ifElse(() => cartCount.value > 0, () => span({ id: 'cart-badge' },
                    css`absolute -top-2 -right-2 md:-right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`,
                    cartCount
                ))
            ),
            a(href`#`, css`text-gray-900 hover:text-primary font-medium text-sm transition-colors w-full md:w-auto text-center`, 'Login'),
            a(href`#`, css`text-white bg-gray-900 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors shadow-sm w-full md:w-auto`, 'Sign Up')
        )
    );
    return nav(css`fixed w-full z-40 top-0 start-0 border-b border-gray-200 glass-effect`,
        div(css`max-w-7xl mx-auto flex flex-wrap items-center justify-between p-4`,
            a(href`#`, css`flex items-center space-x-2`,
                div(css`w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl`, 'D'),
                span(css`self-center text-2xl font-bold whitespace-nowrap tracking-tight text-gray-900`, 'DigiStore')
            ),
            menuButton,
            stickyMenu
        )
    );
}

// ---------------------------------------------------------------------------
// hero (header)
// ---------------------------------------------------------------------------

function hero() {
    return header(css`pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center`,
        h1(css`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight`,
            'The marketplace for ', br(css`hidden md:block`),
            span(css`text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600`, 'premium digital assets')
        ),
        p(css`mt-4 max-w-2xl text-lg text-gray-600 mx-auto mb-10`,
            'Discover high-quality source code, UI kits, e-books, and design resources created by top professionals. Instant access, lifetime updates.'
        ),
        // Search Bar
        div(css`max-w-2xl mx-auto relative shadow-lg rounded-full`,
            div(css`absolute inset-y-0 start-0 flex items-center ps-5 pointer-events-none`,
                i(css`fa-solid fa-search text-gray-400`)
            ),
            input({
                type: 'search',
                id: 'default-search',
                class: 'block w-full p-4 ps-12 text-sm text-gray-900 border border-gray-300 rounded-full bg-white focus:ring-primary focus:border-primary focus:outline-none',
                placeholder: "Search for 'React Template', 'Figma UI Kit'...",
                required: 'required',
                bind: searchQuery,
                oninput: applySearch
            }),
            button(type`submit`,
                css`text-white absolute end-2.5 bottom-2.5 bg-primary hover:bg-primaryHover focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-full text-sm px-6 py-2 transition-colors`,
                'Search')
        ),
        // Filter Pills
        div(css`flex flex-wrap justify-center gap-3 mt-8`,
            button(css`px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors`, 'All Products'),
            button(css`px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors`, 'UI Kits (Figma)'),
            button(css`px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors`, 'Source Code'),
            button(css`px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors`, 'E-Books & PDFs'),
            button(css`px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors`, 'Templates')
        )
    );
}

// ---------------------------------------------------------------------------
// products
// ---------------------------------------------------------------------------

function productCard(product) {
    return div(css`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden flex flex-col group`,
        div(css`relative overflow-hidden aspect-[3/2]`,
            img(alt(product.title), src(product.img), css`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500`),
            div(css`absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-semibold px-2.5 py-1 rounded-full text-gray-800 flex items-center gap-1 shadow-sm`,
                i(css`${product.icon} text-gray-600`), ' ', product.type
            )
        ),
        div(css`p-5 flex-1 flex flex-col`,
            div(css`flex justify-between items-start mb-2`,
                h3(css`text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors`, product.title)
            ),
            div(css`flex items-center text-sm text-gray-500 mb-4`,
                span('By ', product.author),
                span(css`mx-2`, '•'),
                span(css`flex items-center text-yellow-500 text-xs`, i(css`fa-solid fa-star mr-1`), ' ', product.rating)
            ),
            div(css`mt-auto flex items-center justify-between pt-4 border-t border-gray-50`,
                span(css`text-xl font-bold text-gray-900`, `$${product.price.toFixed(2)}`),
                button(css`text-primary hover:text-white border border-primary hover:bg-primary font-medium rounded-lg text-sm px-4 py-2 transition-colors focus:ring-4 focus:outline-none focus:ring-indigo-100`,
                    { onclick() { addToCart(product); } },
                    'Add to Cart')
            )
        )
    );
}

function trending() {
    return main(css`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12`,
        div(css`flex justify-between items-end mb-8`,
            div(
                h2(css`text-2xl font-bold text-gray-900`, 'Trending Now'),
                p(css`text-gray-500 mt-1`, 'Our most popular digital products this week.')
            ),
            a(href`#`, css`text-primary hover:text-primaryHover font-medium text-sm hidden sm:block`, 'View all ', i(css`fa-solid fa-arrow-right ml-1`))
        ),
        div({ id: 'product-grid' }, css`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8`,
            loop(products, product => productCard(product))
        )
    );
}

// ---------------------------------------------------------------------------
// footer
// ---------------------------------------------------------------------------

function socialLink(icon, name) {
    return a(href`#`, css`hover:text-gray-500`,
        span(css`sr-only`, name),
        i(css`fa-brands fa-${icon} text-xl`)
    );
}

function pageFooter() {
    return footer(css`bg-white border-t border-gray-200 mt-20`,
        div(css`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12`,
            div(css`md:flex md:items-center md:justify-between`,
                div(css`flex justify-center md:justify-start items-center mb-6 md:mb-0 space-x-2`,
                    div(css`w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xl`, 'D'),
                    span(css`text-xl font-bold text-gray-900`, 'DigiStore')
                ),
                div(css`flex justify-center space-x-6 md:order-2 text-gray-400`,
                    socialLink('twitter', 'Twitter'),
                    socialLink('github', 'GitHub'),
                    socialLink('dribbble', 'Dribbble')
                ),
                div(css`mt-8 md:mt-0 md:order-1 text-center md:text-left text-sm text-gray-500`,
                    '© 2026 DigiStore, Inc. All rights reserved. Delivering digital excellence.'
                )
            )
        )
    );
}

// ---------------------------------------------------------------------------
// checkout modal
// ---------------------------------------------------------------------------

function cartItemRow(item) {
    return div(css`flex justify-between items-center text-sm`,
        div(css`flex items-center gap-3 truncate pr-4`,
            div(css`w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden`,
                img(src(item.img), css`w-full h-full object-cover`)
            ),
            div(css`truncate`,
                p(css`font-medium text-gray-900 truncate`, item.title),
                p(css`text-gray-500 text-xs`, item.type)
            )
        ),
        span(css`font-semibold text-gray-900 flex-shrink-0`, `$${item.price.toFixed(2)}`)
    );
}

function checkoutModal() {
    return div(ifElse(() => cartOpen.value, () => div({ id: 'checkout-modal' }, css`fixed inset-0 z-50`,
        // Background backdrop
        div({ id: 'modal-backdrop' }, css`fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity backdrop-blur-sm`, { onclick: closeCheckout }),
        div(css`fixed inset-0 z-10 overflow-y-auto`,
            div(css`flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0`,
                // Modal panel
                div({ id: 'modal-panel' }, css`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl`,
                    // Close Button
                    button(type`button`, { onclick: closeCheckout },
                        css`absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors`,
                        i(css`fa-solid fa-xmark`)
                    ),
                    div(css`bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-6`,
                        div(css`sm:flex sm:items-start`,
                            div(css`mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full`,
                                h3({ id: 'modal-title' }, css`text-2xl font-bold leading-6 text-gray-900 mb-6`, 'Complete your purchase'),
                                div(css`grid grid-cols-1 md:grid-cols-2 gap-8`,
                                    // Order Summary
                                    div(
                                        h4(css`font-semibold text-gray-900 mb-4 border-b pb-2`, 'Order Summary'),
                                        div({ id: 'checkout-items' }, css`space-y-4 mb-4 min-h-[100px]`,
                                            loop(cart, item => cartItemRow(item))
                                        ),
                                        div(css`border-t pt-4 flex justify-between items-center font-bold text-lg text-gray-900`,
                                            span('Total'),
                                            span({ id: 'checkout-total' }, '$', cartTotal)
                                        )
                                    ),
                                    // Payment Details
                                    div(css`bg-gray-50 p-5 rounded-xl border border-gray-100`,
                                        h4(css`font-semibold text-gray-900 mb-4`, 'Payment Details'),
                                        // Delivery Note
                                        div(css`mb-5 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex gap-3 items-start`,
                                            i(css`fa-solid fa-cloud-arrow-down text-primary mt-1`),
                                            p(css`text-xs text-indigo-900`,
                                                strong('Instant Digital Delivery.'), ' ', br(),
                                                'Upon payment, a download link will be emailed to you immediately. Files will also be permanently available in your ',
                                                a(href`#`, css`underline font-semibold hover:text-primary`, 'My Assets'),
                                                ' tab.'
                                            )
                                        ),
                                        form({ onsubmit: processPayment },
                                            div(css`space-y-4`,
                                                div(
                                                    label(css`block text-sm font-medium text-gray-700 mb-1`, 'Email Address'),
                                                    input({ type: 'email', required: 'required', placeholder: 'you@example.com' },
                                                        css`w-full rounded-md border-gray-300 border p-2.5 text-sm focus:ring-primary focus:border-primary outline-none`)
                                                ),
                                                div(
                                                    label(css`block text-sm font-medium text-gray-700 mb-1`, 'Card Details'),
                                                    div(css`relative`,
                                                        input({ type: 'text', required: 'required', placeholder: '0000 0000 0000 0000' },
                                                            css`w-full rounded-md border-gray-300 border p-2.5 pl-10 text-sm focus:ring-primary focus:border-primary outline-none`),
                                                        i(css`fa-regular fa-credit-card absolute left-3 top-3 text-gray-400`)
                                                    )
                                                ),
                                                div(css`grid grid-cols-2 gap-4`,
                                                    input({ type: 'text', required: 'required', placeholder: 'MM/YY' },
                                                        css`rounded-md border-gray-300 border p-2.5 text-sm focus:ring-primary focus:border-primary outline-none`),
                                                    input({ type: 'text', required: 'required', placeholder: 'CVC' },
                                                        css`rounded-md border-gray-300 border p-2.5 text-sm focus:ring-primary focus:border-primary outline-none`)
                                                )
                                            ),
                                            button(type`submit`,
                                                css`mt-6 w-full text-white bg-gray-900 hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-3 text-center transition-colors shadow-lg flex justify-center items-center gap-2`,
                                                ifElse(() => processing.value,
                                                    () => span(i(css`fa-solid fa-circle-notch fa-spin`), ' Processing...'),
                                                    () => span(i(css`fa-solid fa-lock text-xs`), ' Pay Securely'))
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    )));
}

// ---------------------------------------------------------------------------
// success modal
// ---------------------------------------------------------------------------

function successModal() {
    return div(ifElse(() => successOpen.value, () => div({ id: 'success-modal' }, css`fixed inset-0 z-[60]`,
        div(css`fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity backdrop-blur-sm`),
        div(css`fixed inset-0 z-10 overflow-y-auto`,
            div(css`flex min-h-full items-center justify-center p-4 text-center`,
                div(css`relative transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl transition-all w-full max-w-sm`,
                    div(css`mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4`,
                        i(css`fa-solid fa-check text-2xl text-green-600`)
                    ),
                    h3(css`text-xl font-bold text-gray-900 mb-2`, 'Payment Successful!'),
                    p(css`text-sm text-gray-500 mb-6`,
                        "Thank you for your purchase. We've sent the files to your email. You can also download them anytime from your ",
                        strong('My Assets'), ' dashboard.'
                    ),
                    button({ onclick: closeSuccess },
                        css`w-full text-white bg-primary hover:bg-primaryHover font-medium rounded-lg text-sm px-5 py-2.5 text-center transition-colors`,
                        'Go to My Assets')
                )
            )
        )
    )));
}

// ---------------------------------------------------------------------------
// page root
// ---------------------------------------------------------------------------

let stylesApplied = false;

export function Landing() {
    if (!stylesApplied) {
        stylesApplied = true;
        Jetz.style(`html { scroll-behavior: smooth; }
body, #landing-page { font-family: 'Inter', sans-serif; }
.glass-effect { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }`);
    }
    // the template applies these classes to <body>
    document.body.className = 'bg-gray-50 text-gray-800 antialiased relative';
    return div({ id: 'landing-page' },
        navbar(),
        hero(),
        trending(),
        pageFooter(),
        checkoutModal(),
        successModal()
    );
}
