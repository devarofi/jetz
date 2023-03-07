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
with state list :
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
