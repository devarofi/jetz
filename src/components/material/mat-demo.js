import { addScript } from "../../lib/helper";
import { a, div } from "../../lib/ui"
import { btnDropdown, dropdown, mBtnLight, mCol12, mCol6, mRow, navBar, preloaderCircular } from "../materialize/material-components"

export let materialDemo = [
    mRow(
        navBar([ 'Home', 'Contact', 'About' ]),
        mCol12(
            'this is body',
            div(
                dropdown([
                    'One', 'Two', 'Three'
                ]).id('dropdown2'),
                btnDropdown('dropdown2', 'Dropdown')
            )
        )
    ),
    mRow(
        mCol12()
    )
]

addScript('https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js');