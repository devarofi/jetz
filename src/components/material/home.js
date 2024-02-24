import { listOf, loop, stateOf, _ } from "../../lib/jetz";
import { a, div, li, p, span } from "../../lib/jetz-ui";
import { btnDropdown, dropdown, mBtnLight, mCol12, mRow } from "../materialize/material-components";


export let homeComponent = () => {
    let stateCounter = stateOf(0);
    let cityListState = listOf('Jakarta', 'Bandung', 'Bogor');

    return mRow(
        mCol12(
            loop(cityListState, city => {
                return div(city);
            }),
            p('State was called on Top : Count ', stateCounter),
            mBtnLight('Count').on('click', () => {
                stateCounter.value  += 1;
            }),
            span('This is text : ', stateCounter),
            div(
                dropdown([
                    a('One', { href: '#!' }),
                    a('Two', { href: '#!' }).on('click', () => {
                        alert('Aww Snap')
                    })
                ]).id('dropdown2').addClass('dropdown-content'),
                btnDropdown('dropdown2', 'Dropdown'),
                
                mBtnLight('Add Dropdown Item', {
                    onclick: function() {
                        this.findId('dropdown2').append(
                            li(
                                a('New Item', { href: '#!' })
                            ))
                    }
                }),
                mBtnLight('Remove City', {
                    onclick: () => {
                        cityListState.removeAt(1);
                        console.log(cityListState.get(1))
                    }
                }),
                mBtnLight('New City', {
                    onclick: () => {
                        cityListState.push('Cikampek')
                    }
                }),
            )
        )
    ).onRendered(() => {
        M.AutoInit();
        console.log('Sekali Init');
    })
}