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
It's just a little sample, i'm not yet ready for release. But, you can support me 😁

If this repository get 100 stars i'll focus to develop this library more intens. ☕

Author @daevsoft
