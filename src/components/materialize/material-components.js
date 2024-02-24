import { css } from "../../lib/helper";
import { a, button, div, i, inputNumber, inputText, label, li, nav, span, ul } from "../../lib/jetz-ui";

export let mContainer = (...args) => div({ class: 'container' }, args);
export let mRow = (...args) => div({ class: 'row' }, args);
export let mCol1 = (...args) => div({ class: 'col s1' }, args);
export let mCol2 = (...args) => div({ class: 'col s2' }, args);
export let mCol3 = (...args) => div({ class: 'col s3' }, args);
export let mCol4 = (...args) => div({ class: 'col s4' }, args);
export let mCol5 = (...args) => div({ class: 'col s5' }, args);
export let mCol6 = (...args) => div({ class: 'col s6' }, args);
export let mCol7 = (...args) => div({ class: 'col s7' }, args);
export let mCol8 = (...args) => div({ class: 'col s8' }, args);
export let mCol9 = (...args) => div({ class: 'col s9' }, args);
export let mCol10 = (...args) => div({ class: 'col s10' }, args);
export let mCol11 = (...args) => div({ class: 'col s11' }, args);
export let mCol12 = (...args) => div({ class: 'col s12' }, args);
export let mBtnLight = (...args) => button({ class: 'waves-effect waves-light btn' }, args);
export let preloaderCircular = (...args) => div({ class: 'preloader-wrapper big active' }, args,
    div(css('spinner-layer spinner-blue-only'), 
        div(css('circle-clipper left'),
            div(css('circle'))),
        div(css('gap-patch'),
            div(css('circle'))),
        div(css('circle-clipper right'),
            div(css('circle')))
    )
)
export let navBar = (menus = [], ...args) => {
    return nav(args,
        div({ class: 'nav-wrapper' },
            mCol12(
                a({ href:'#', class: 'brand-logo' }, 'Logo'),
                ul({ class: 'right hide-on-med-and-down', id: 'nav-mobile' },
                    menus
                    .map(menu => li(
                        menu
                    ))
                )
            )
        )
    )
}
export let dropdown = (collections = [], ...args) => ul(args, { class: 'dropdown-content' },
    collections.map((item, i) => li({ tabIndex: i },
        item
    ))
)
export let btnDropdown = (target, ...args) => a(args, 
    i({ class:'material-icons right' }, 'arrow_drop_down'),
    {
        class: 'btn dropdown-trigger', 
        href: '#!',
        'data-target': target
    });

export let mInputTextField = (id, placeholder,...args) => {
    let inputField = inputText({ class: 'validate' }).id(id);
    let inputBase = div({ class: 'input-field' },
        inputField,
        label({ for: id }, placeholder)
    );
    inputBase['value'] = function(value = null){
        return inputField.value(value)
    }
    return inputBase;
}
export let mInputNumberField = (id, placeholder,...args) => {
    return div({ class: 'input-field' },
        inputNumber({ class: 'validate' }).id(id),
        label({ for: id }, placeholder)
    )
}