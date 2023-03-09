# Jetz 🚀
Jetz is a front-end framework javascript for build a front end with declarative javascript DOM.

## Demo
Write this command in terminal :
```terminal
npm install
npm run watch
npm run start
```

## Why Jetz
Jetz is inspired by Jetpack Compose. Is using for creating rich UI with simple, fast, declarative syntax in android. But Jetz was coming for Web Developers.

## Built-in
```
- element function
- state management
- routing
```

## How to Render Elements?
Empty body element in index.html
```html
<body></body>
```
```javascript
import { Jetz } from "./src/jetz/jetz";
import { find } from "./src/jetz/jetz-ui";

let App = div('Hello World');

Jetz.mount(App, document.body);
```


Thinking in Jetz 
in html :
``` html
<div class="container">
  <ul class="todo-list">
    <li>Item 1 </li>
    <li>Item 2</li>
    <li>Item 3</li>
   </ul>
</div>
```
in javascript with Jetz :
``` javascript
const item = [1, 2, 3];
const todo =
  div( css`container`, 
    ul( css`todo-list`,
      items.map(data => li('Item ' + data))
    )
  );
```

## Event Listener
in html :
``` html
<button class="btn btn-info" type="button" onclick="showAlert('Aww Snap')">
  Show Alert
</button>
....
<script>
  function showAlert(text){
    alert(text);
  }
</script>
```
in javascript with Jetz :
``` javascript
button('Show Alert', css`btn btn-info`, {
  onclick(){
    alert('Aww Snap');
  }
});
```

## DOM Element
in html :
``` html
<p id="my-content">This is paragraph of your content</p>
<button type="button" onclick="changeText()"></button>
...
<script>
  let myContent = document.getElementById('my-content');
  function changeText(){
    myContent.innerText = 'Paragraph was changed into other content';
  }
</script>
```
in javascript with Jetz :
``` javascript
let myContent = p('This is paragraph of your content');
button({
  onclick(){
    myContent.text('Paragraph was changed into other content');
  }
});
```

## Component or Function or Variable
You can define a Component with three ways, with Component class, Function, or Variable : <br>
With variable :
```javascript
let MovieApp = div( css`container`,
  div( css`row`,
    div( css`col-md-3`,
      ul( css`navbar`,
        li( css`navbar-item`, 'MENU 1'),
        li( css`navbar-item`, 'MENU 1'),
        li( css`navbar-item`, 'MENU 1')
      )
    ),
    div( css`col-md-9`,
      // ...
    ),
    // ...
  )
  // ...
);
export default MovieApp;
```
Or with Function :
```javascript
function MovieApp(){
  return div( css`container`,
    div( css`row`,
      //...
    ),
    //...
  )
}
export default MovieApp;
```
Or with Component class, it's need a `render` method to render an element :
```javascript
class MovieApp extends Component {
  showMessage(message){
    alert(message);
  }
  render(){
    return (
      div( css`movie-body`,
        button( css`btn btn-info`, 'Show Message', {
          onclick:() => {
            this.showMessage('Hello World');
          }
        })
        //...
      )
    )
  }
}
export default MovieApp;
```
## Passing Data between Function or Component
<p>You can passing data as argument of class or argument function it self, example :</p>

With function
```javascript
let PostCard = function(title, content){
  return div( css`card`,
    div( css`card-title`, title),
    div( css`card-body`,
      p(content)
    )
  )
}
// Sample with data
let userPosts = [
  { title: 'Black Bird', message: 'A bird with black color'},
  { title: 'Red Bird', message: 'A bird with red color'},
  { title: 'Green Bird', message: 'A bird with green color'},
];

// Call a function in element child
let RootPage = div( css`container`, 
  div( css`row`,
    div( css`col-12`,
      loop( userPosts, post => PostCard(post.title, post.message))
    )
  )
)
```
Passing data in Component
```javascript
class MyButton extends Component{
    say = '';
    word = '';

    constructor(say, word){
        super();
        this.say = say;
        this.word = word;
    }
    
    showMessage(){
        alert(`${this.say} ${this.word}`);
    }

    render(){
        return (
            button('Show Message', {
                onclick:() => this.showMessage()
            })
        )
    }
}
// sample instance variable
let _mybutton = new MyButton('Hello', 'World');

// Call Component in element
let RootPage = main( css`container`,
  // with new instance
  new MyButton('Hello', 'World'),
  // OR with new function
  MyButton.new('Hello', 'World'),
  // Or with instance variable
  _mybutton
);
```

## Event Listener
To create an event listener in element, you can write directly in element or using find to search element by selector.
### Example Listener 
```javascript
let myCounter = function(){
  let counter = stateOf(0);
  return button('Count : ', counter, {
    onclick(){
      counter.value++;
    }
  })
};
export default myCounter;
```
Or 
```javascript
let counter = stateOf(0);
let myCounter = button('Count : ', counter, {
  onclick(){
    counter.value++;
  }
});
export default myCounter;
```
Or
```javascript
let counter = stateOf(0);
let myCounter = button('Count : ', counter)
                .on('click', e => { counter.value++; });
```
Or in Component class 
<p>Note : if you want to use `this` as Component it self, you must write listener with arrow function</p>

```javascript
export class MyCounter {
  counter = stateOf(0);
  render(){
    return button('Counter', this.counter, {
      onclick:() => {
        this.counter.value++;
      }
    })
  }
}
```
## State Management
Jetz was have a state built-in, which is `stateOf` and `listOf` and `sequenceOf`
### stateOf
<p>stateOf function is used for single value it could be string, numeric, object, or element.</p>
example

```javascript
let counter = stateOf(0);
let myButton = button('Clicked ', counter, {
  onclick(){
    counter.value++;
  }
})
```

### listOf
<p>listOf function is used for array/collections of value it could be string, numeric, object, or element.</p>
example

```javascript
let myStack = listOf();
let myButton = button('Clicked ', {
  onclick(){
    myStack.push('New Item');
  }
})
```
### sequenceOf
<p>sequenceOf function is used for unique string or number, that may be same value, but element is different</p>
example

```javascript
let myStack = sequenceOf();
let MyApp = main(
  ul(
    loop( myStack , stack => (
      li(stack, button('delete', {
        onclick() {
          myStack.remove(stack)
        }
      })
    )
  ),
  button('Clicked ', {
    onclick(){
      myStack.push('New Item');
    }
  })
)
```
### Example State
Example state list :
``` javascript
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
```
Jetz with state and binding value :
``` javascript
let myState = stateOf('');
let myComponent = div(
  div('My name is : ', myState),
  inputText({
    bind: myState,
    placeholder: 'Input your name...'
  })
);
```
## Dispatcher
``` javascript
let pageContent = stateOf(div())

let dispatcher = new Dispatcher(action => {
  if(action === 'home'){
    pageContent.value = home()
  }else if(action === 'about'){
    pageContent.value = about()
  }else if(action === 'contact-us'){
    pageContent.value = contactUs()
  }
})

let myApp = main(
  nav(
    ul(
      li('Home').on('click', () => dispatcher.dispatch('home')),
      li('About').on('click', () => dispatcher.dispatch('about')),
      li('Contact Us').on('click', () => dispatcher.dispatch('contact-us'))
    )
  ),
  pageContent
)
```
## Router
Register route into Jetz
```javascript
import { Jetz } from "./src/lib/jetz";
import { Router, route } from "./src/lib/jetz-router";
import { MovieApp } from './src/components/movie-app/movie-app';
import { MovieHome } from "./src/components/movie-app/movie-home";
import { MovieSeries } from "./src/components/movie-app/movie-series";

let router = new Router(
    route('/', MovieHome),
    route('series', MovieSeries)
);
// register router in Jetz
Jetz.use(router);
// mount compose element into document.body
Jetz.mount(MovieApp, document.body);
```
Place routeBrowser and link in element
```javascript
function menuBar(){
  return ul( css`menu-list`,
    link('/',
      li( css`menu-item`, 'Home')
    ),
    link('series',
      li( css`menu-item`, 'Series')
    ),
  )
}

let MovieApp = function(){
  return main(
    menuBar,
    Jetz.$route.browser()
  )
}
export default MovieApp;
```


It's just a little sample, i'm not yet ready for release. But, you can support me 😁

If this repository get 100 stars i'll focus to develop this library more intens. ☕

Author @daevsoft
