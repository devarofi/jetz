import { Dispacher, Jetz, stateOf } from "../../lib/jetz";
import { addScript } from "../../lib/helper";
import { a, div, p, li, span, b } from "../../lib/ui"
import { btnDropdown, dropdown, mBtnLight, mCol12, mCol2, mCol6, mContainer, mRow, navBar, preloaderCircular } from "../materialize/material-components"
import { aboutComponent } from "./about";
import { contactComponent } from "./contact";
import { homeComponent } from "./home";

let PageContent = stateOf(homeComponent());

let dispacher = new Dispacher(action =>{
    if(action === 'contact'){
        PageContent.value = contactComponent;
    }else if(action === 'about'){
        PageContent.value = aboutComponent;
    }else if(action === 'home'){
        PageContent.value = homeComponent()
    }
});


export let materialDemo = [
    mRow(
        navBar([ 
            a('Home').on('click', () => {
                dispacher.dispatch('home')
            }), 
            a('Contact Us').on('click', () => {
                dispacher.dispatch('contact')
            }), 
            a('About').on('click', () => {
                dispacher.dispatch('about')
            }), 
        ])
    ),
    PageContent
]