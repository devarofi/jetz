import { listOf, loop, stateOf } from "../../lib/jetz";
import { button, div, hr, inputText, li, main, ul } from "../../lib/jetz-ui";


let cartState = listOf();
let myApp = main(
  ul(
    loop(cartState, item => li(item))
  ),
  button('Add new item', {
    onclick() {
      cartState.push(`New Item ${cartState.length + 1}`)
    }
  })
);
export let counter = main(
    myApp,
    hr,
    loop([1,2,3], item => {
        let countState = stateOf(0);
        let nameState = stateOf('Your name');
        
        return div(
            div(nameState),
            div('Counter for '+ item +' : ', countState),
            inputText({
                style:{
                    width:'100%'
                },
                bind:nameState
            }),
            button('Add +1', {
                onclick() {
                    countState.value++;
                    if(countState.value == 2){
                        this.style.backgroundColor = 'red'
                    }
                }
            })
        )
    })
).onRendered(() => {
    console.log('rendered')
});