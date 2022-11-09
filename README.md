# Jetz 🚀
Jetz is a library for writing front end with declarative javascript DOM.

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
  div({ class:'container' }, 
    ul({ class:'todo-list' },
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
button('Show Alert', {
  class:'btn btn-info', 
  onclick: () => {
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
  onclick: () => myContent.text('Paragraph was changed into other content')
});
```
It's just a little sample, i'm not yet ready for release. But, you can support me 😁

If this repository get 100 stars i'll focus to develop this library more intens. ☕

Author @daevsoft
