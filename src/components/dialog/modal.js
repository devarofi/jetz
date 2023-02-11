import { stateOf } from "../../lib/jetz";
import { button, div, h2, h4, p } from "../../lib/ui";

let showModal = stateOf('none')
let stateWidth = stateOf('80%')

let cardModal = div({
    style: {
        display: showModal,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0, 0.4)'
    }},
    div({
        style: {
            backgroundColor: 'white',
            width: stateWidth,
            margin: '15% auto',
            padding: '20px',
            display:'block'
        }},
        h2('This is modal'),
        button('Close', {
            onclick: () => {
                showModal.value = 'none';
            }
        }),
        button('Green Background', {
            onclick: () => {
                cardModal.style.backgroundColor = 'green';
            }
        }),
        button('Change Width', {
            onclick: () => {
                stateWidth.value = '50%';
            }
        })
))

export let modal = div(
    cardModal,
    button('Show Modal', {
        onclick: () => {
            showModal.value = 'block';
        }
    })
);