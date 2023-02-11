
import('./public/css/todo-v2.css');

// import { counter } from "./src/components/counter/counter";
import { home } from "./src/components/home/home-component";
import { Jetz } from "./src/lib/jetz";

Jetz.mount(home, document.body, {
    onStart() {
        console.log('Started')
    },
    onLoad(){
        console.log('Loaded')
    }
});